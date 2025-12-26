
import handler from 'serve-handler';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((request, response) => {
    return handler(request, response, {
        public: path.join(__dirname, 'dist'),
        // Optional: configuration
        rewrites: [
            { source: "**", destination: "/index.html" } // SPA fallback
        ]
    });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Running at http://localhost:' + port);
});
