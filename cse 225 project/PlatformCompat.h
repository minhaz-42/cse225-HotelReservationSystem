#ifndef PLATFORMCOMPAT_H
#define PLATFORMCOMPAT_H

#include <cstdlib>
#include <iostream>
#include <limits>

#ifdef _WIN32
  #include <conio.h>
  inline int hrs_getch() { return _getch(); }
  inline void hrs_clear_screen() { std::system("cls"); }
  inline void hrs_pause() { std::system("pause"); }
#else
  #include <termios.h>
  #include <unistd.h>

  inline int hrs_getch() {
    termios oldt{};
    termios newt{};

    tcgetattr(STDIN_FILENO, &oldt);
    newt = oldt;
    newt.c_lflag &= static_cast<unsigned>(~(ICANON | ECHO));
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);

    const int ch = getchar();

    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
    return ch;
  }

  inline void hrs_clear_screen() { std::system("clear"); }

  inline void hrs_pause() {
    std::cout << "Press Enter to continue...";
    std::cout.flush();
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    std::cin.get();
  }
#endif

#endif
