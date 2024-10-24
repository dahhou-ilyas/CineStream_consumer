const { connect, StringCodec } = require("nats");

class NATSConnection {
    static instance = null;
    static sc = null;

    static async initialize() {
        try {
            const nc = await connect({ servers: "localhost:4222" });
            this.sc = StringCodec();
            this.instance = nc;
            console.log("Connecté à NATS");
            return true;
        } catch (err) {
            console.error("Erreur lors de la connexion à NATS:", err);
            return false;
        }
    }

    static getNatsConnection() {
        return this.instance;
    }

    static getStringCodec() {
        return this.sc;
    }
}

module.exports = NATSConnection;