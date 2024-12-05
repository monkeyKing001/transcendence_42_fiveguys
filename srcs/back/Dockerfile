# Use the official Node.js 16 image as the base image
FROM node:alpine

# Set the working directory inside the container

RUN mkdir /back
WORKDIR /back
RUN mkdir /my-app
RUN apk add sudo
WORKDIR /back/my-app

COPY init.sh /back

# Copy the package.json and package-lock.json files into the container
COPY my-app/package*.json ./

# Install project dependencies
# RUN npm install

# Copy all files from the current directory into the container
COPY my-app/ ./

# Build the TypeScript project
# RUN npm run build

# Expose the port that your Nest.js application is running on (change it to your application's port if needed)
EXPOSE 3001

# Start the Nest.js application
CMD [ "sh", "../init.sh" ]

