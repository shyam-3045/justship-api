FROM node:18

RUN apt-get update && apt-get install -y git openssl

WORKDIR /app

COPY ./builder.sh .

RUN chmod +x ./builder.sh

CMD ["./builder.sh"]