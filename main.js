const net = require("net");
const fs = require("fs");
const zlib = require("zlib");
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const url = request.split(" ")[1];
    const method = request.split(" ")[0];
    const headers = request.split("\r\n");
    if (url == "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (url.includes("/test/")) {
      const content = url.split("/test/")[1];
      let requestArray = request.split("\r\n");
      const encodingHeader = requestArray
        .find((e) => e.includes("Accept-Encoding"))
        ?.split(": ")[1];
      if (encodingHeader && encodingHeader.includes("gzip")) {
        const compressedData = zlib.gzipSync(content);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressedData.length}\r\n\r\n`
        );
        socket.write(compressedData);
      } else {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      }
    } else if (url.includes("/user-agent")) {
      const userAgent = headers[2].split("User-Agent: ")[1];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      );
    } else if (method == "GET" && url.startsWith("/files/")) {
      const directory = process.argv[3];
      const filename = url.split("/files/")[1];
      if (fs.existsSync(`${directory}/${filename}`)) {
        const fileContent = fs
          .readFileSync(`${directory}/${filename}`)
          .toString();
        const httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}\r\n`;
        socket.write(httpResponse);
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (method == "POST") {
      const directory = process.argv[3];
      const fileContent = request.split("\r\n")[4];
      const fileName = url.split("/files/")[1];
      fs.writeFileSync(`${directory}/${fileName}`, fileContent);
      socket.write("HTTP/1.1 201 Created\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    socket.end();
  });
});

server.listen(8080, "localhost", () => {
  console.log("Server is on");
});
