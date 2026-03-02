# Codem Studios

Codem Studios is a custom-built media player application specifically designed for **Tizen TVs (Samsung Smart TVs)**. It provides a seamless way to browse and play media from external storage (USB) with a modern, focus-driven user interface.

## 🚀 Key Features

-   **Cinematic Intro**: Plays a high-quality video intro (`intro.mp4`) on startup to provide a premium brand experience.
-   **USB Storage Detection**: Automatically detects connected USB storage devices using Tizen-specific APIs.
-   **Optimized Navigation**: Full D-pad and remote control support, allowing users to navigate through menus and media with standard TV remote keys.
-   **Custom Video Player**: A robust HTML5-based video player with a dedicated UI for:
    -   Playlist management
    -   Play/Pause, Seeking, and Next/Previous episode control
    -   Support for "Anime Series" structure (recognizes subfolders as individual series)
-   **Premium Aesthetics**: Dark-themed, modern UI designed for high-resolution 1080p and 4K displays.

## 📂 Project Structure

-   `config.xml`: Application configuration, Tizen privileges, and metadata.
-   `index.html`: Entry point with intro video and main menu.
-   `main.js`: Logic for intro handling, USB detection, and menu navigation.
-   `player.html` / `player.js`: The core video playback engine and player UI.
-   `css/`: Contains styling for the main menu (`style.css`) and the video player (`player.css`).

## 🛠 Prerequisites

-   **Tizen Studio**: Required for building and deploying to Tizen TVs.
-   **Samsung Smart TV (or Emulator)**: To run and test the application.

## 📖 Usage

1.  Open the project in **Tizen Studio**.
2.  Deploy to a connected **Samsung Smart TV** or the **Tizen Emulator**.
3.  Upon launch, you'll see the intro video followed by the main menu.
4.  Connect a **USB drive** with your media files to use the **USB Player** feature.
