// config.js
const APP_VERSION = "8.4"; // Server-backed file storage

// Local Admin Configuration
// Default password is "admin" - change via LocalAuth.setAdminPassword('newpassword')
const ADMIN_EMAIL = "admin@dojo.local";

const GITHUB_REPO_URL = "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME";

const DEFAULT_FILAMENTS = [
  "Jade White", "Light Gray", "Orange", "Sunflower Yellow", "Mistletoe Green", "Cocoa Brown",
  "Red", "Cyan", "Cobalt Blue", "Purple", "Blue Grey", "Hot Pink", "Black",
  "Matte Ivory White", "Matte Lilac Purple", "Matte Mandarin Orange", "Matte Plum",
  "Matte Dark Red", "Matte Grass Green", "Matte Dark Blue", "Matte Ash Gray", "Matte Charcoal",
  "Glow in Dark Blue", "Translucent Red", "Silk Blue Hawaii", "Wood Black Walnut",
  "Metal Iridium Gold", "Metal Copper Brown", "Metal Iron Gray", "Silk+ Gold",
  "PETG Translucent Clear", "Flashforge Burnt Titanium", "Rock PLA Mars Red",
  "Elegoo Burgundy Red", "PLA-CF Burgundy Red", "Polylite PETG Gray"
];

// Default Mock Data
const defaultNews = [{ id: "n1", title: "Minecraft Night", date: "Nov 22", badge: "SOON" }];
const defaultRules = [{ id: "r1", title: "General", desc: "Respect the Dojo equipment.", penalty: "-1 Coin" }];
const defaultCoins = [{ id: "c1", task: "Wear Uniform", val: "+1", type: "silver" }];
const defaultCatalog = [{ id: "cat1", name: "Star", cost: "50", tier: "tier1", category: "standard", icon: "fa-star", visible: true }];

const mockLeaderboard = [{ id: "l1", name: "Asher C.", points: 1250, belt: "Blue", username: "asher.cullin" }];
