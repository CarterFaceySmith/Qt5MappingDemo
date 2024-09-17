<h3 align="center">Qt6 CPP Mapping Demo</h3>
<br>
<p align="center"><i>A Qt6 mapping demo utilizing a C++ backend with a QML middle/core layer for initialising and running a map screen in JavaScript with various entities and parameters</i></p>

## About The Project

This project demonstrates how to integrate a Qt6-based mapping interface with a C++ backend and a QML middle/core layer. The demo showcases the use of Qt6 to create a map screen, manage multiple entities, and handle various parameters through JavaScript. This is ideal for applications requiring interactive and dynamic map visualisations.

## Pre-requisites

Ensure you have the following software installed before you start:

- **Qt6**: This project relies on Qt6 libraries and tools.

## Building and Running the Project

If using Qt Creator as your IDE of choice, simply clone the repo and load it in as a project, it will auto-configure and you can build and run via the `Ctrl + R` keybind.

Alternatively, follow these steps to build and run the Qt6 mapping demo manually:

1. **Clean Previous Builds** (if applicable): 
    ```bash
    rm -rf build
    ```

2. **Optional: Create Build Directory**: 
    ```bash
    mkdir build
    ```

3. **Navigate to Build Directory**: 
    ```bash
    cd build
    ```

4. **Generate Build Files Using CMake**: 
    ```bash
    cmake .. -DCMAKE_PREFIX_PATH=/path/to/Qt6
    ```
    Replace `/path/to/Qt6` with the path to your Qt6 installation if it's not in your default search paths.

5. **Compile the Project**: 
    ```bash
    make
    ```

6. **Run the Application**: 
    ```bash
    ./Qt6MappingDemo
    ```

## Notes

If you have any issues or questions, please feel free to [contact me](mailto:carterfs@proton.me).

### References

For more information on Qt6 and its modules, visit the [Qt Documentation](https://doc.qt.io/qt-6/).

