# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install --production

# Copy the rest of your application source code to the working directory
COPY . .

# Expose the port on which your application will run
EXPOSE 5000

# Specify the command to run when the container starts
CMD [ "npm", "start" ]
