const axios = require("axios");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

class Microservice {
  constructor(name, version, port, registryUrl) {
    this.name = name;
    this.version = version;
    this.port = port;
    this.registryUrl = registryUrl || "http://localhost:3000";
    this.app = express();

    // Set up middleware
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan("combined"));

    // Add health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "UP" });
    });
  }

  async registerWithRegistry() {
    try {
      const response = await axios.put(
        `${this.registryUrl}/register/${this.name}/${this.version}/${this.port}`
      );

      console.log(`Service registered: ${this.name}@${this.version}`);
      return response.data.result;
    } catch (error) {
      console.error("Failed to register with service registry:", error.message);
      throw error;
    }
  }

  async unregisterWithRegistry() {
    try {
      const response = await axios.delete(
        `${this.registryUrl}/register/${this.name}/${this.version}/${this.port}`
      );

      console.log(`Service unregistered: ${this.name}@${this.version}`);
      return response.data.result;
    } catch (error) {
      console.error("Failed to unregister with service registry:", error.message);
      throw error;
    }
  }

  start() {
    // Register with registry when starting
    this.registerWithRegistry();

    // Set up periodic registration renewal
    this.registryInterval = setInterval(() => {
      this.registerWithRegistry();
    }, 20 * 1000); // Every 20 seconds

    // Start the server
    this.server = this.app.listen(this.port, () => {
      console.log(`${this.name} microservice v${this.version} listening on port ${this.port}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }

  async shutdown() {
    console.log(`Shutting down ${this.name} microservice`);

    // Clear the registry interval
    if (this.registryInterval) {
      clearInterval(this.registryInterval);
    }

    // Unregister from registry
    try {
      await this.unregisterWithRegistry();
    } catch (error) {
      console.error("Error unregistering service:", error);
    }

    // Close the server
    if (this.server) {
      this.server.close(() => {
        console.log(`${this.name} microservice stopped`);
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

module.exports = Microservice;
