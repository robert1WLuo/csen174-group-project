This project is to develop a web-based application that allows users to set up user-edited plant profile and routine to keep track of necessary plumbing, watering, etc.
The main contributors of this project are Wenguang Luo, Jixian Deng, Valerie Prompa(quit). 
The work is divided as follows: Wenguang Luo is responsible for ui design, front end interface, adding and editing plant profile, backend database for plant
Jixian Deng is responsible for backend database for user, login with credentials, reminder email feature


Project Title:  Plant Diary 
Problem Statement: 
Mental health benefits, lower grocery bills, there’s plenty of reasons to grow plants. However, a 
lot of beginner plant keepers don’t know how to care for their plants, and don’t know what to do 
when their plants are sick. Some of them even don’t know what the exact name of their plant is. 
While there is information in books and online, it is not only hard for beginners to find, but also 
hard to tell how trustworthy their information resources are. Plant Diary will solve these 
problems and encourage a more sustainable future, and a lot more green thumbs. 
Our software aims to solve these problems for the users and provide emotional support. The 
users upload their plant information and the app will build a short profile about the plants including 
reminding notification for the plants. The app will also implement some community features, where the users can 
discuss in a feed or upload the pictures of their plants and build their own plant photo diary. 
There are existing apps that do the plant recognition process but our app aims to go beyond that 
simple question response phase and aim to build a community to connect plants lovers. 
Our application is more useful because it clusters all information and features a plant keeper 
needs in one single app, and it could potentially foster a community of people with similar 
interests. It stands out for having a vibe of encouraging and plant-loving, which would provide 
our users with a sense of belonging and self-care. 

How to Run
1. configure environment variables in the terminal

export SMTP_USER="plantdiaryCSEN174@gmail.com"
export SMTP_PASS="vuyfuzctuxzybzkt"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_SECURE="tls"
export FROM_EMAIL="plantdiaryCSEN174@gmail.com"
export FROM_NAME="Plant Diary"

2. Start PHP Backend in terminal
php -S 127.0.0.1:8000 api.php

3. Access Application
Open in browser: http://127.0.0.1:8000/login.html
4. Test Flow
==========================

ALL FEATURES:
Register a new account
Login with credentials
View your profile  
Edit plant profile(add description, upload plant image, etc)
Set routine reminders(deadline for watering, plumbing, etc)
send reminding emails to users when reminding deadline is close
Chat with other users(currently saved in local computer cache only)
Logout when done

