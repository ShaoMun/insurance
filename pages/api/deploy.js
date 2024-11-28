import { exec } from "child_process";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  const deployScript = path.join(process.cwd(), "scripts/deploy.js");

  exec(`npx hardhat run ${deployScript} --network arbitrumSepolia`, (error, stdout, stderr) => {
    if (error) {
      console.error("Error during deployment:", stderr);
      return res.status(500).json({ message: "Deployment failed", error: stderr });
    }

    console.log("Deployment successful:", stdout);
    res.status(200).json({ message: "Deployment successful", output: stdout });
  });
}
