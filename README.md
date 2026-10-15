# Space Marine 2 Arsenal (NeoForge 1.20.1)

Fan-made mod. Content: Bolter, Bolt Pistol, Bolt Shell, Melta Rifle, Combat Knife, Chainsword,
Power Sword, Frag Grenade, 4-piece Power Armor. All textures are PLACEHOLDERS.

## Build
1. Install JDK 17.
2. Copy `gradlew`, `gradlew.bat` and the `gradle/` folder from the official Forge/NeoForge 1.20.1 MDK
   into this folder (or run `gradle wrapper` if Gradle is installed).
3. `./gradlew build` -> jar in `build/libs/`. Put it in `mods/` of a NeoForge 1.20.1 profile.
   For development: `./gradlew runClient`.

## Сборка без установки чего-либо (GitHub Actions)
1. Создай пустой репозиторий на github.com и загрузи в него все файлы проекта (включая папку .github).
2. Открой вкладку Actions -> "Build mod jar" -> дождись зелёной галочки.
3. Внутри запуска скачай artifact `sm2mod-jar` - там готовый .jar для папки mods.
