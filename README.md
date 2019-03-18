* tutorials
  * https://anadea.info/blog/building-desktop-app-with-electron
  * https://electronjs.org/docs/tutorial/first-app
  * https://github.com/eatrero/electron-rsync.git


* Packaging
  https://medium.com/heresy-dev/auto-updating-apps-for-windows-and-osx-using-electron-the-complete-guide-4aa7a50b904c

    electron-packager . --overwrite --platform=darwin --arch=x64 --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds

    "pack:osx": "./node_modules/.bin/electron-packager . $npm_package_productName --app-version=$npm_package_version --version=0.36.7 --out=builds --ignore='^/builds$' --platform=darwin --arch=x64 --sign='Developer ID Application: My Company Ltd (ABCDEFGH10)'



Add release:
  https://github.com/iffy/electron-updater-example