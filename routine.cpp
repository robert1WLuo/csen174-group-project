#include <iostream>
#include <cstring>
#include <vector>
using namespace std;

int main() {
    char plant[50];
    cout << "What is the name of your plant?" << endl;
    cin >> plant;
    if (strcmp(plant, "sunflower") == 0){
        cout << "Routine:" << endl;
        cout << "Monday: Water -- Morning" << endl;
        cout << "Tuesday: Water -- Morning" << endl;
        cout << "Wednesday: Water -- Morning" << endl;
        cout << "Thursday: Water -- Morning" << endl;
        cout << "Friday: Water -- Morning" << endl;
    }
    if (strcmp(plant, "cactus") == 0){
        cout << "Routine:" << endl;
        cout << "Monday: Water -- Morning" << endl;
        cout << "Tuesday: " << endl;
        cout << "Wednesday: " << endl;
        cout << "Thursday: " << endl;
        cout << "Friday: Water -- Morning" << endl;
    }
    if (strcmp(plant, "hibiscus") == 0){
        cout << "Routine:" << endl;
        cout << "Monday: Water -- Morning, Evening" << endl;
        cout << "Tuesday: " << endl;
        cout << "Wednesday: Water -- Morning, Evening" << endl;
        cout << "Thursday: " << endl;
        cout << "Friday: Water -- Morning, Evening" << endl;
    }
    return 0;
}