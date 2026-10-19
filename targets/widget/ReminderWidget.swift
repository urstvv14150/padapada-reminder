import WidgetKit
import SwiftUI
import AppIntents

// App Group = "group." + 主 App 的 bundle id。
// 小工具的 bundle id 是「主 App bundle id + 一段」，去掉最後一段即可，兩邊不會打錯。
private let appGroup: String = {
    var parts = (Bundle.main.bundleIdentifier ?? "").split(separator: ".").map(String.init)
    if parts.count > 1 { parts.removeLast() }
    return "group." + parts.joined(separator: ".")
}()

// MARK: - 資料（由 React Native 端寫入 UserDefaults 的 JSON）

struct Palette: Codable { let bg, card, text, subText, primary, onPrimary, border: String }
struct Look: Codable { let font: String; let radius: Double; let style: String }
struct Cat: Codable, Identifiable { let id, name, color, icon, mode: String }
struct Item: Codable, Identifiable {
    let id, cat, text, label: String
    let ts: Double                       // 毫秒；0 代表沒有提醒時間
    var date: Date { Date(timeIntervalSince1970: ts / 1000) }
}
struct Mark: Codable { let cat, t: String }
struct Labels: Codable { let all, add, empty, daily: String }

struct Payload: Codable {
    let palette: Palette
    let look: Look
    let labels: Labels
    let locale: String
    let categories: [Cat]
    let items: [Item]
    let marks: [String: [Mark]]

    static let fallback = Payload(
        palette: Palette(bg: "#080A1C", card: "#12153A", text: "#E6F7FF", subText: "#7F8BC0",
                         primary: "#00F0FF", onPrimary: "#02131A", border: "#3A2D8F"),
        look: Look(font: "mono", radius: 8, style: "grid"),
        labels: Labels(all: "All", add: "Add", empty: "Nothing here yet", daily: "Daily"),
        locale: "en", categories: [], items: [], marks: [:])

    static func load() -> Payload? {
        guard let s = UserDefaults(suiteName: appGroup)?.string(forKey: "widgetData"),
              let d = s.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Payload.self, from: d)
    }
}

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var v: UInt64 = 0
        Scanner(string: h).scanHexInt64(&v)
        self.init(red: Double((v >> 16) & 0xFF) / 255,
                  green: Double((v >> 8) & 0xFF) / 255,
                  blue: Double(v & 0xFF) / 255)
    }
}

func fnt(_ size: CGFloat, _ w: Font.Weight, _ look: Look) -> Font {
    let d: Font.Design = look.font == "mono" ? .monospaced
        : look.font == "serif" ? .serif
        : look.font == "rounded" ? .rounded : .default
    return .system(size: size, weight: w, design: d)
}

// MARK: - 分類選擇（長按小工具 → 編輯小工具 → 分類）

struct CategoryEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Category"
    static let defaultQuery = CategoryQuery()
    var id: String
    var name: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(name)") }
}

struct CategoryQuery: EntityQuery {
    private func all() -> [CategoryEntity] {
        let p = Payload.load() ?? .fallback
        return [CategoryEntity(id: "all", name: p.labels.all)]
            + p.categories.map { CategoryEntity(id: $0.id, name: $0.name) }
    }
    func entities(for identifiers: [String]) async throws -> [CategoryEntity] {
        all().filter { identifiers.contains($0.id) }
    }
    func suggestedEntities() async throws -> [CategoryEntity] { all() }
}

struct SelectCategoryIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Category"
    static let description = IntentDescription("Choose which category this widget shows.")
    @Parameter(title: "Category") var category: CategoryEntity?
}

// MARK: - Timeline

struct ReminderEntry: TimelineEntry {
    let date: Date
    let payload: Payload?
    let catId: String
}

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> ReminderEntry {
        ReminderEntry(date: .now, payload: .fallback, catId: "all")
    }

    func snapshot(for configuration: SelectCategoryIntent, in context: Context) async -> ReminderEntry {
        ReminderEntry(date: .now, payload: Payload.load() ?? .fallback, catId: configuration.category?.id ?? "all")
    }

    func timeline(for configuration: SelectCategoryIntent, in context: Context) async -> Timeline<ReminderEntry> {
        let now = Date()
        let p = Payload.load()
        let cat = configuration.category?.id ?? "all"
        var dates: [Date] = [now]
        if let p = p {
            // 每則提醒時間過後各排一筆，「下一則」會自動前進
            dates += p.items
                .filter { $0.ts > 0 && $0.date > now && (cat == "all" || $0.cat == cat) }
                .prefix(10).map { $0.date.addingTimeInterval(1) }
        }
        if let midnight = Calendar.current.nextDate(
            after: now, matching: DateComponents(hour: 0, minute: 1), matchingPolicy: .nextTime) {
            dates.append(midnight)
        }
        let entries = Set(dates).sorted().map { ReminderEntry(date: $0, payload: p, catId: cat) }
        return Timeline(entries: entries, policy: .atEnd)
    }
}

// MARK: - 主題背景（跟 App 同一套風格）

struct GridLines: View {
    let color: Color
    var body: some View {
        Canvas { ctx, size in
            var path = Path()
            var x: CGFloat = 0
            while x <= size.width { path.move(to: CGPoint(x: x, y: 0)); path.addLine(to: CGPoint(x: x, y: size.height)); x += 24 }
            var y: CGFloat = 0
            while y <= size.height { path.move(to: CGPoint(x: 0, y: y)); path.addLine(to: CGPoint(x: size.width, y: y)); y += 24 }
            ctx.stroke(path, with: .color(color), lineWidth: 0.5)
        }
    }
}

struct RainStreaks: View {
    let color: Color
    var body: some View {
        Canvas { ctx, size in
            var path = Path()
            for i in 0..<45 {
                let x = CGFloat((i * 53) % 100) / 100 * size.width
                let y = CGFloat((i * 37) % 100) / 100 * size.height
                path.move(to: CGPoint(x: x, y: y))
                path.addLine(to: CGPoint(x: x - 4, y: y + 14))
            }
            ctx.stroke(path, with: .color(color), lineWidth: 1)
        }
    }
}

struct DotsPattern: View {
    let color: Color
    var body: some View {
        Canvas { ctx, size in
            var row = 0
            var y: CGFloat = 0
            while y <= size.height {
                var x: CGFloat = row % 2 == 0 ? 0 : 14
                while x <= size.width {
                    ctx.fill(Path(ellipseIn: CGRect(x: x - 2, y: y - 2, width: 4, height: 4)), with: .color(color))
                    x += 28
                }
                y += 28; row += 1
            }
        }
    }
}

struct Mountains: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 0, y: r.maxY))
        p.addLine(to: CGPoint(x: 0, y: r.height * 0.6))
        p.addQuadCurve(to: CGPoint(x: r.width * 0.3, y: r.height * 0.3), control: CGPoint(x: r.width * 0.12, y: r.height * 0.3))
        p.addQuadCurve(to: CGPoint(x: r.width * 0.55, y: r.height * 0.7), control: CGPoint(x: r.width * 0.42, y: r.height * 0.15))
        p.addQuadCurve(to: CGPoint(x: r.width * 0.78, y: r.height * 0.2), control: CGPoint(x: r.width * 0.66, y: r.height * 0.55))
        p.addQuadCurve(to: CGPoint(x: r.maxX, y: r.height * 0.55), control: CGPoint(x: r.width * 0.92, y: r.height * 0.2))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        p.closeSubpath()
        return p
    }
}

struct ThemeBackground: View {
    let p: Palette
    let look: Look
    var body: some View {
        ZStack {
            Color(hex: p.bg)
            switch look.style {
            case "grid":
                GridLines(color: Color(hex: p.primary).opacity(0.10))
                RadialGradient(colors: [Color(hex: p.primary).opacity(0.28), .clear],
                               center: .topTrailing, startRadius: 0, endRadius: 190)
            case "ink":
                Mountains().fill(Color(hex: p.text).opacity(0.07))
                    .frame(height: 80).frame(maxHeight: .infinity, alignment: .bottom)
                RoundedRectangle(cornerRadius: 2).fill(Color(hex: p.primary).opacity(0.85))
                    .frame(width: 12, height: 12).padding(10)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
            case "rain":
                RainStreaks(color: Color(hex: p.text).opacity(0.10))
                RadialGradient(colors: [Color(hex: p.primary).opacity(0.30), .clear],
                               center: .bottomLeading, startRadius: 0, endRadius: 200)
            case "dots":
                DotsPattern(color: Color(hex: p.primary).opacity(0.22))
            default:
                EmptyView()
            }
        }
    }
}

// MARK: - 共用小元件

struct PlusBadge: View {
    let p: Palette
    var size: CGFloat = 22
    var body: some View {
        ZStack {
            Circle().fill(Color(hex: p.primary))
            Capsule().fill(Color(hex: p.onPrimary)).frame(width: size * 0.46, height: 2)
            Capsule().fill(Color(hex: p.onPrimary)).frame(width: 2, height: size * 0.46)
        }
        .frame(width: size, height: size)
    }
}

func addURL(_ e: ReminderEntry) -> URL {
    var s = "myreminder://quick-add"
    if e.catId != "all" { s += "?categoryId=\(e.catId)" }
    return URL(string: s)!
}

func catColor(_ p: Payload, _ id: String) -> Color {
    Color(hex: p.categories.first(where: { $0.id == id })?.color ?? p.palette.primary)
}

func headerTitle(_ p: Payload, _ e: ReminderEntry) -> String {
    e.catId == "all" ? p.labels.all : (p.categories.first(where: { $0.id == e.catId })?.name ?? p.labels.all)
}

func visibleItems(_ p: Payload, _ e: ReminderEntry) -> [Item] {
    p.items.filter { ($0.ts == 0 || $0.date > e.date) && (e.catId == "all" || $0.cat == e.catId) }
}

struct Header: View {
    let p: Payload
    let e: ReminderEntry
    var link: Bool
    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(e.catId == "all" ? Color(hex: p.palette.primary) : catColor(p, e.catId))
                .frame(width: 7, height: 7)
            Text(headerTitle(p, e))
                .font(fnt(12, .bold, p.look))
                .foregroundColor(Color(hex: p.palette.subText))
                .lineLimit(1)
            Spacer()
            if link {
                Link(destination: addURL(e)) { PlusBadge(p: p.palette) }
            } else {
                PlusBadge(p: p.palette)
            }
        }
    }
}

struct RowView: View {
    let p: Payload
    let item: Item
    var body: some View {
        Link(destination: URL(string: "myreminder://quick-add?id=\(item.id)")!) {
            HStack(spacing: 8) {
                Capsule().fill(catColor(p, item.cat)).frame(width: 3, height: 24)
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.text)
                        .font(fnt(13, .semibold, p.look))
                        .foregroundColor(Color(hex: p.palette.text))
                        .lineLimit(1)
                    Text(item.label)
                        .font(fnt(10, .regular, p.look))
                        .foregroundColor(Color(hex: p.palette.subText))
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(RoundedRectangle(cornerRadius: min(p.look.radius, 10)).fill(Color(hex: p.palette.card).opacity(0.92)))
        }
    }
}

// MARK: - 各尺寸版面

struct SmallView: View {
    let p: Payload
    let e: ReminderEntry
    let items: [Item]
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Header(p: p, e: e, link: false)
            if let first = items.first {
                Text(first.text)
                    .font(fnt(16, .bold, p.look))
                    .foregroundColor(Color(hex: p.palette.text))
                    .lineLimit(3)
                Text(first.label)
                    .font(fnt(11, .medium, p.look))
                    .foregroundColor(Color(hex: p.palette.primary))
                    .lineLimit(1)
                if items.count > 1 {
                    Text("+\(items.count - 1)")
                        .font(fnt(11, .regular, p.look))
                        .foregroundColor(Color(hex: p.palette.subText))
                }
            } else {
                Text(p.labels.empty)
                    .font(fnt(13, .regular, p.look))
                    .foregroundColor(Color(hex: p.palette.subText))
            }
            Spacer(minLength: 0)
        }
    }
}

struct MediumView: View {
    let p: Payload
    let e: ReminderEntry
    let items: [Item]
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Header(p: p, e: e, link: true)
            if items.isEmpty {
                Text(p.labels.empty)
                    .font(fnt(13, .regular, p.look))
                    .foregroundColor(Color(hex: p.palette.subText))
            } else {
                ForEach(Array(items.prefix(3))) { RowView(p: p, item: $0) }
            }
            Spacer(minLength: 0)
        }
    }
}

struct CalendarView: View {
    let p: Payload
    let e: ReminderEntry
    let items: [Item]

    private var cal: Calendar { Calendar(identifier: .gregorian) }
    private var locale: Locale { Locale(identifier: p.locale) }

    private var cells: [Date?] {
        let start = cal.date(from: cal.dateComponents([.year, .month], from: e.date))!
        let range = cal.range(of: .day, in: .month, for: start)!
        var arr: [Date?] = Array(repeating: nil, count: cal.component(.weekday, from: start) - 1)
        for d in range { arr.append(cal.date(byAdding: .day, value: d - 1, to: start)) }
        while arr.count % 7 != 0 { arr.append(nil) }
        return arr
    }

    private var monthTitle: String {
        let f = DateFormatter()
        f.locale = locale
        f.setLocalizedDateFormatFromTemplate("yMMMM")
        return f.string(from: e.date)
    }

    private var weekdays: [String] {
        let f = DateFormatter()
        f.locale = locale
        return f.veryShortStandaloneWeekdaySymbols
    }

    private func key(_ d: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    var body: some View {
        let c = p.palette
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                Text(monthTitle)
                    .font(fnt(16, .bold, p.look))
                    .foregroundColor(Color(hex: c.text))
                Text(headerTitle(p, e))
                    .font(fnt(10, .semibold, p.look))
                    .foregroundColor(Color(hex: c.subText))
                    .lineLimit(1)
                Spacer()
                Link(destination: addURL(e)) { PlusBadge(p: c) }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7), spacing: 0) {
                ForEach(0..<7, id: \.self) { i in
                    Text(weekdays[i])
                        .font(fnt(9, .medium, p.look))
                        .foregroundColor(Color(hex: c.subText))
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7), spacing: 2) {
                ForEach(Array(cells.enumerated()), id: \.offset) { _, d in
                    if let d = d { dayCell(d) } else { Color.clear.frame(height: 34) }
                }
            }

            VStack(spacing: 4) {
                ForEach(Array(items.prefix(2))) { RowView(p: p, item: $0) }
            }
            .padding(.top, 4)
            Spacer(minLength: 0)
        }
    }

    @ViewBuilder
    private func dayCell(_ d: Date) -> some View {
        let c = p.palette
        let isToday = cal.isDate(d, inSameDayAs: e.date)
        let marks = (p.marks[key(d)] ?? []).filter { e.catId == "all" || $0.cat == e.catId }
        VStack(spacing: 1) {
            HStack(spacing: 2) {
                Text("\(cal.component(.day, from: d))")
                    .font(fnt(10, isToday ? .bold : .regular, p.look))
                    .foregroundColor(isToday ? Color(hex: c.onPrimary) : Color(hex: c.text))
                    .frame(width: 16, height: 16)
                    .background(Circle().fill(isToday ? Color(hex: c.primary) : .clear))
                if marks.count > 1 {
                    Text("+\(marks.count - 1)")
                        .font(fnt(7, .regular, p.look))
                        .foregroundColor(Color(hex: c.subText))
                }
            }
            if let m = marks.first {
                Text(m.t)
                    .font(fnt(8, .medium, p.look))
                    .foregroundColor(Color(hex: c.text))
                    .lineLimit(1)
                    .padding(.horizontal, 2)
                    .frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 3).fill(catColor(p, m.cat).opacity(0.35)))
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, minHeight: 34, maxHeight: 34)
    }
}

struct LockView: View {
    let items: [Item]
    let title: String
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(title).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            if let first = items.first {
                Text(first.text).font(.headline).lineLimit(2)
                Text(first.label).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            } else {
                Text("—")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct NoDataView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Open the app once to sync")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.white)
            Text(appGroup)
                .font(.system(size: 9, design: .monospaced))
                .foregroundColor(.gray)
        }
    }
}

struct EntryView: View {
    let entry: ReminderEntry
    @Environment(\.widgetFamily) var family

    private var isAccessory: Bool {
        family == .accessoryRectangular || family == .accessoryInline || family == .accessoryCircular
    }

    var body: some View {
        content.containerBackground(for: .widget) {
            if let p = entry.payload, !isAccessory {
                ThemeBackground(p: p.palette, look: p.look)
            } else if entry.payload == nil && !isAccessory {
                Color(hex: "#1C1C1E")
            } else {
                Color.clear
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let p = entry.payload {
            let items = visibleItems(p, entry)
            switch family {
            case .systemLarge:
                CalendarView(p: p, e: entry, items: items)
            case .systemMedium:
                MediumView(p: p, e: entry, items: items)
            case .accessoryRectangular, .accessoryCircular:
                LockView(items: items, title: headerTitle(p, entry)).widgetURL(addURL(entry))
            case .accessoryInline:
                Text(items.first?.text ?? "—").widgetURL(addURL(entry))
            default:
                SmallView(p: p, e: entry, items: items).widgetURL(addURL(entry))
            }
        } else {
            NoDataView()
        }
    }
}

// MARK: - Widget

@main
struct ReminderWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "ReminderWidget", intent: SelectCategoryIntent.self, provider: Provider()) { entry in
            EntryView(entry: entry)
        }
        .configurationDisplayName("Reminder")
        .description("Reminders and calendar by category")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge,
                            .accessoryRectangular, .accessoryInline])
    }
}
