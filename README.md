# KaamSey App
This app developed in
* Ionic 6
* Angular 14
* Run `npm i` to install node modules
* Run `ionic serve` to run in browser
# Need installed below items
* Node JS version 14.17.5
* Ionic CLI 6
* ANgular CLI 14 

# Generate Android apk commands
```
ionic build
```
```
npx cap sync android
```
```
npx cap open android
```
# Generate Android apk commands
* Generate key command
```
keytool -genkey -v -keystore KaamSeyapp.keystore -alias KaamSeyapp -keyalg RSA -keysize 2048 -validity 20000
```
# This is the real key store. you can find it in project root name KaamSeyapp.keystore file.
``
keytool -list -v -keystore KaamSeyapp.keystore -alias KaamSeyapp -storepass KaamSeyapp -keypass KaamSeyapp
``

* keystore=KaamSeyapp.keystore
* keypass=KaamSeyapp
* alias=KaamSeyapp
* password=KaamSeyapp