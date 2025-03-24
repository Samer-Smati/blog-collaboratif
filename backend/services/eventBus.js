const amqp = require("amqplib");
const config = require("../config");

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "blog_events";
    this.queues = {};
    this.connect();
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Create exchange
      await this.channel.assertExchange(this.exchange, "topic", { durable: true });

      console.log("Connected to RabbitMQ");

      // Handle connection close
      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed, reconnecting...");
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      console.error("RabbitMQ connection error:", error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(routingKey, message) {
    try {
      if (!this.channel) {
        throw new Error("Channel not available");
      }

      const success = this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      return success;
    } catch (error) {
      console.error(`Error publishing message to ${routingKey}:`, error);
      throw error;
    }
  }

  async subscribe(serviceName, routingKey, callback) {
    try {
      if (!this.channel) {
        throw new Error("Channel not available");
      }

      // Create queue for this service
      const queueName = `${serviceName}_${routingKey.replace(/\./g, "_")}`;
      await this.channel.assertQueue(queueName, { durable: true });

      // Bind queue to exchange with routing key
      await this.channel.bindQueue(queueName, this.exchange, routingKey);

      // Consume messages
      await this.channel.consume(queueName, (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            this.channel.ack(msg);
          } catch (error) {
            console.error(`Error processing message from ${routingKey}:`, error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      console.log(`Subscribed to ${routingKey}`);
      this.queues[routingKey] = queueName;
    } catch (error) {
      console.error(`Error subscribing to ${routingKey}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
