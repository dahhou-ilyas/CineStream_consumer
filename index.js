const express = require('express');
const app = express();

const NATSConnection = require('./consumer/consumer');


app.get('/films_stream', async (req, res) => {
    const nc = NATSConnection.getNatsConnection();
    if (!nc) {
        res.status(500).send("Connexion NATS non initialisée");
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.write('event: connected\ndata: Connexion établie\n\n');

    try {
        const sub = nc.subscribe("filmsChan");
        const sc = NATSConnection.getStringCodec();

        let subscription = null;

        const sendSSEMessage = (message) => {
            res.write(`event: message\ndata: ${message}\n\n`);
        };

        (async () => {
            subscription = sub;
            for await (const m of sub) {
                const message = sc.decode(m.data);
                console.log('Message reçu:', message);
                sendSSEMessage(message);
            }
        })().catch(err => {
            console.error("Erreur lors de la réception du message:", err);
            sendSSEMessage(JSON.stringify({ error: "Erreur de stream" }));
        });

        req.on('close', () => {
            console.log("Client déconnecté");
            if (subscription) {
                subscription.unsubscribe();
            }
            res.end();
        });
        

    } catch (err) {
        console.error("Erreur lors de l'abonnement:", err);
        res.status(500).send("Erreur dans le stream");
    }
});

async function startServer() {
    try {
        const initialized = await NATSConnection.initialize();
        if (!initialized) {
            console.error("Impossible de démarrer le serveur : échec de l'initialisation de NATS");
            process.exit(1);
        }

        app.listen(3000, () => {
            console.log("Serveur en écoute sur le port 3000");
        });
    } catch (err) {
        console.error("Erreur lors du démarrage du serveur:", err);
        process.exit(1);
    }
}

startServer();