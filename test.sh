#!/bin/bash
#
### POST ###
## ex)
## curl -s -X POST \
##    'https://jsonplaceholder.typicode.com/posts' \
##    -H 'Content-Type: application/json' \
##    -d '{ "title": "fooBatch", "completed": false, "userId": 1 }' \
#
echo "\nsignup test"
	curl -s -X POST \
	   'http://localhost:3000/auth/signup' \
	   -H 'Content-Type: application/json' \
		-d '{
			"intraId": "test",
			"password" : "password"
		}' \

#signin test worng`
#echo "WRONG TEST"
# curl -s -X POST \
#    'http://localhost:3000/auth/signin' \
#	-d '{
#	"email": "email@test.com",
#	"password" : "password"
#	}' \

#signin test correct`
echo "\nCORRECT TEST"
 curl -s -X POST \
    'http://localhost:3000/auth/signin' \
    -H 'Content-Type: application/json' \
	-d '{
		"intraId": "test",
		"password" : "password"
	}' \
#
##signin test wrong password
# curl -s -X POST \
#    'http://localhost:3000/auth/signin' \
#    -H 'Content-Type: application/json' \
#	-d '{
#	"email": "new2@test.com",
#	"password" : "badpassword"
#	}' \
#
#		#####    SESSION TEST    ####
##signin test correct`
# curl -s -X POST \
#    'http://localhost:3000/auth/signin' \
#    -H 'Content-Type: application/json' \
#	-d '{
#	"email": "new2@test.com",
#	"password" : "chdwkdtlf1!"
#	}' \
#
##signin test wrong
# curl -s -X POST \
#    'http://localhost:3000/auth/signin' \
#    -H 'Content-Type: application/json' \
#	-d '{
#	"email": "new2@test.com",
#	"password" : "badpassword"
#	}' \
#
##whoami
#echo "TESTING WHOAMI\n"
# curl -s -X GET \
#    'http://localhost:3000/auth/whoami' \
#
##signout 
#echo "TESTING SIGNOUT\n"
# curl -s -X POST \
#    'http://localhost:3000/auth/signout' \
#
##whoami guard test(prevent session from who didn't signin)
#echo "TESTING WHOAMI WITH GUARD\n"
# curl -s -X GET \
#    'http://localhost:3000/auth/whoami' \
#
#### GET ###
### ex)
### curl -s -X GET -G \
###    'https://jsonplaceholder.typicode.com/todos' \
###    -d 'userId=1'
#
#### GET 1 with parameter ###
##curl -s -X GET -G \
##    'http://localhost:3000/auth/1' \
#
#### GET 2 : get a particular msg ###
##curl -s -X GET -G \
##   'http://localhost:3000/auth' \
#
#### GET 3 : admin ###
##curl -s -X GET -G \
##    'http://localhost:3000/admin/auth/1' \
