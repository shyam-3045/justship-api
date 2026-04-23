FROM node:18

RUN apt-get update && apt-get install -y git openssl

WORKDIR /app

RUN mkdir -p /app && chown -R 1000:1000 /app

COPY ./builder.sh .

RUN chmod +x ./builder.sh

USER 1000:1000

CMD ["./builder.sh"]