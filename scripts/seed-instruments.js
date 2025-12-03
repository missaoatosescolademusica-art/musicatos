// This file seeds the instruments list into a configuration file
// Run this in the scripts folder to initialize the instruments seed data

const fs = require("fs")
const path = require("path")

const instruments = ["Violão", "Canto", "Teclado", "Bateria"]

const configDir = path.join(process.cwd(), "config")
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

fs.writeFileSync(path.join(configDir, "instruments.json"), JSON.stringify({ instruments }, null, 2))

console.info("✓ Instruments seed created successfully");
