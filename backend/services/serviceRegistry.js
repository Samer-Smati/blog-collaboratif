const express = require("express");
const axios = require("axios");

class ServiceRegistry {
  constructor() {
    this.services = {};
    this.timeout = 30; // seconds
    this.cleanup();
  }

  register(name, version, ip, port) {
    const key = name + version + ip + port;

    if (!this.services[key]) {
      this.services[key] = {};
      console.log(`Added service ${name}, version ${version} at ${ip}:${port}`);
    }

    this.services[key].name = name;
    this.services[key].version = version;
    this.services[key].ip = ip;
    this.services[key].port = port;
    this.services[key].timestamp = Math.floor(Date.now() / 1000);

    return key;
  }

  unregister(name, version, ip, port) {
    const key = name + version + ip + port;

    delete this.services[key];

    console.log(`Removed service ${name}, version ${version} at ${ip}:${port}`);

    return key;
  }

  get(name, version) {
    const candidates = Object.values(this.services).filter(
      (service) => service.name === name && service.version === version
    );

    // Return a random service from the candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  cleanup() {
    const now = Math.floor(Date.now() / 1000);

    Object.keys(this.services).forEach((key) => {
      if (this.services[key].timestamp + this.timeout < now) {
        delete this.services[key];
        console.log(`Removed expired service: ${key}`);
      }
    });

    // Run cleanup every 10 seconds
    setTimeout(() => this.cleanup(), 10 * 1000);
  }
}

module.exports = ServiceRegistry;
