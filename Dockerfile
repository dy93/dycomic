FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Create .ssh directory
RUN mkdir -p /root/.ssh
COPY deploy_key /root/.ssh/id_rsa
RUN echo "Host *" > /root/.ssh/config
RUN echo "StrictHostKeyChecking no" >> /root/.ssh/config
RUN chmod -R 600 /root/.ssh

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000

CMD [ "./run.sh" ]