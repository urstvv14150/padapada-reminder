# MyReminder (Expo + iOS WidgetKit)

## 安裝
```
npx create-expo-app@latest my-reminder -t default
cd my-reminder
# 刪掉預設的 app/，把本專案的 app/ src/ targets/ app.json 複製進去

npx expo install expo-router expo-notifications expo-localization expo-status-bar expo-constants \
  @react-native-async-storage/async-storage @react-native-community/datetimepicker \
  react-native-safe-area-context react-native-svg
npm i @tanstack/react-query @bacons/apple-targets
```

## 設定（只需要改 app.json）
- `ios.bundleIdentifier`：你的 bundle id，例如 `com.me.myreminder`
- `ios.entitlements` 的 App Group 必須是 `group.` + bundle id，例如 `group.com.me.myreminder`
- `ios.appleTeamId`：你的付費開發者 Team ID（免費帳號不能用 App Group）

App 端、小工具端的 App Group 都會自動由 bundle id 推出，不用再手動改多個檔案。

## 執行
```
npx expo prebuild -p ios --clean
npx expo run:ios --device
```

## 小工具使用
1. 長按主畫面 → 加入小工具 → MyReminder，選尺寸。
2. 長按該小工具 → 編輯小工具 → 分類：選「全部」或任一分類。
   每個小工具可以選不同分類，所以可以同時放 4 個、各顯示一個分類。
3. 舊版已加過的小工具請刪掉重加（設定方式變了）。
4. 若小工具顯示「Open the app once to sync」：開啟 App，到「主題」頁按「重新同步小工具」，
   並確認那頁顯示的 App Group 和小工具上的字串相同。
