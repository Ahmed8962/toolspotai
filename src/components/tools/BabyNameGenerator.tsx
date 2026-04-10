"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

type Gender = "boy" | "girl" | "unisex";
type Origin =
  | "English"
  | "Latin"
  | "Greek"
  | "Hebrew"
  | "Arabic"
  | "Celtic"
  | "Germanic"
  | "Sanskrit"
  | "Japanese"
  | "Spanish"
  | "French"
  | "Italian"
  | "African";

interface BabyName {
  name: string;
  gender: Gender;
  origin: Origin;
  meaning: string;
  rank: number;
}

type SortMode = "alpha" | "popularity" | "random";
type LengthFilter = "all" | "short" | "medium" | "long";

const FAMOUS_PEOPLE: Record<string, string[]> = {
  Liam: ["Liam Neeson", "Liam Hemsworth", "Liam Gallagher"],
  Noah: ["Noah Centineo", "Noah Schnapp", "Noah Wyle"],
  Oliver: ["Oliver Stone", "Oliver Reed", "Oliver Twist (fiction)"],
  James: ["James Dean", "James Brown", "James Cameron"],
  Elijah: ["Elijah Wood", "Elijah Muhammad", "Elijah Cummings"],
  William: ["William Shakespeare", "Prince William", "William Faulkner"],
  Henry: ["Henry Ford", "Henry Cavill", "Henry VIII"],
  Lucas: ["George Lucas", "Lucas Hedges", "Lucas Cranach"],
  Benjamin: ["Benjamin Franklin", "Benjamin Netanyahu", "Benjamin Bratt"],
  Theodore: ["Theodore Roosevelt", "Dr. Seuss (Theodor Geisel)", "Theodore Dreiser"],
  Olivia: ["Olivia Wilde", "Olivia Colman", "Olivia Rodrigo"],
  Emma: ["Emma Watson", "Emma Stone", "Emma Thompson"],
  Charlotte: ["Charlotte Brontë", "Princess Charlotte", "Charlotte Gainsbourg"],
  Amelia: ["Amelia Earhart", "Amelia Bloomer", "Amelia Warner"],
  Sophia: ["Sophia Loren", "Sophia Bush", "Sophia Vergara"],
  Isabella: ["Isabella Rossellini", "Queen Isabella I", "Isabella Bird"],
  Mia: ["Mia Farrow", "Mia Hamm", "Mia Wasikowska"],
  Ava: ["Ava Gardner", "Ava DuVernay", "Ava Max"],
  Harper: ["Harper Lee", "Harper Beckham", "Harper's Bazaar (magazine)"],
  Luna: ["Luna Lovegood (fiction)", "Luna Maya", "Luna Blaise"],
};

const NAMES: BabyName[] = [
  // ── Boys (100) ──
  { name: "Liam", gender: "boy", origin: "Celtic", meaning: "Strong-willed warrior and protector", rank: 1 },
  { name: "Noah", gender: "boy", origin: "Hebrew", meaning: "Rest, comfort, wanderer", rank: 2 },
  { name: "Oliver", gender: "boy", origin: "Latin", meaning: "Olive tree, symbol of peace", rank: 3 },
  { name: "James", gender: "boy", origin: "Hebrew", meaning: "Supplanter, one who follows", rank: 4 },
  { name: "Elijah", gender: "boy", origin: "Hebrew", meaning: "My God is Yahweh", rank: 5 },
  { name: "William", gender: "boy", origin: "Germanic", meaning: "Resolute protector", rank: 6 },
  { name: "Henry", gender: "boy", origin: "Germanic", meaning: "Ruler of the home", rank: 7 },
  { name: "Lucas", gender: "boy", origin: "Latin", meaning: "Bringer of light", rank: 8 },
  { name: "Benjamin", gender: "boy", origin: "Hebrew", meaning: "Son of the right hand", rank: 9 },
  { name: "Theodore", gender: "boy", origin: "Greek", meaning: "Gift of God", rank: 10 },
  { name: "Jack", gender: "boy", origin: "English", meaning: "God is gracious", rank: 11 },
  { name: "Levi", gender: "boy", origin: "Hebrew", meaning: "Joined, attached", rank: 12 },
  { name: "Alexander", gender: "boy", origin: "Greek", meaning: "Defender of the people", rank: 13 },
  { name: "Mason", gender: "boy", origin: "English", meaning: "Worker in stone", rank: 14 },
  { name: "Ethan", gender: "boy", origin: "Hebrew", meaning: "Strong, firm, enduring", rank: 15 },
  { name: "Daniel", gender: "boy", origin: "Hebrew", meaning: "God is my judge", rank: 16 },
  { name: "Jacob", gender: "boy", origin: "Hebrew", meaning: "Supplanter, held by the heel", rank: 17 },
  { name: "Michael", gender: "boy", origin: "Hebrew", meaning: "Who is like God?", rank: 18 },
  { name: "Logan", gender: "boy", origin: "Celtic", meaning: "Little hollow", rank: 19 },
  { name: "Jackson", gender: "boy", origin: "English", meaning: "Son of Jack", rank: 20 },
  { name: "Sebastian", gender: "boy", origin: "Greek", meaning: "Venerable, revered", rank: 21 },
  { name: "Aiden", gender: "boy", origin: "Celtic", meaning: "Little fire", rank: 22 },
  { name: "Matthew", gender: "boy", origin: "Hebrew", meaning: "Gift of God", rank: 23 },
  { name: "Samuel", gender: "boy", origin: "Hebrew", meaning: "Heard by God", rank: 24 },
  { name: "David", gender: "boy", origin: "Hebrew", meaning: "Beloved", rank: 25 },
  { name: "Joseph", gender: "boy", origin: "Hebrew", meaning: "He will add", rank: 26 },
  { name: "Carter", gender: "boy", origin: "English", meaning: "Cart driver", rank: 27 },
  { name: "Owen", gender: "boy", origin: "Celtic", meaning: "Young warrior, noble born", rank: 28 },
  { name: "Wyatt", gender: "boy", origin: "English", meaning: "Brave in war", rank: 29 },
  { name: "John", gender: "boy", origin: "Hebrew", meaning: "God is gracious", rank: 30 },
  { name: "Luke", gender: "boy", origin: "Greek", meaning: "Light-giving", rank: 31 },
  { name: "Dylan", gender: "boy", origin: "Celtic", meaning: "Son of the sea", rank: 32 },
  { name: "Grayson", gender: "boy", origin: "English", meaning: "Son of the steward", rank: 33 },
  { name: "Jayden", gender: "boy", origin: "Hebrew", meaning: "Thankful, God will judge", rank: 34 },
  { name: "Gabriel", gender: "boy", origin: "Hebrew", meaning: "God is my strength", rank: 35 },
  { name: "Isaac", gender: "boy", origin: "Hebrew", meaning: "He will laugh", rank: 36 },
  { name: "Lincoln", gender: "boy", origin: "English", meaning: "Town by the pool", rank: 37 },
  { name: "Anthony", gender: "boy", origin: "Latin", meaning: "Priceless one", rank: 38 },
  { name: "Hudson", gender: "boy", origin: "English", meaning: "Son of Hugh", rank: 39 },
  { name: "Thomas", gender: "boy", origin: "Greek", meaning: "Twin", rank: 40 },
  { name: "Charles", gender: "boy", origin: "Germanic", meaning: "Free man", rank: 41 },
  { name: "Christopher", gender: "boy", origin: "Greek", meaning: "Bearer of Christ", rank: 42 },
  { name: "Jaxon", gender: "boy", origin: "English", meaning: "Son of Jack", rank: 43 },
  { name: "Maverick", gender: "boy", origin: "English", meaning: "Independent, nonconformist", rank: 44 },
  { name: "Josiah", gender: "boy", origin: "Hebrew", meaning: "God supports and heals", rank: 45 },
  { name: "Isaiah", gender: "boy", origin: "Hebrew", meaning: "Salvation of the Lord", rank: 46 },
  { name: "Andrew", gender: "boy", origin: "Greek", meaning: "Manly, courageous", rank: 47 },
  { name: "Nathan", gender: "boy", origin: "Hebrew", meaning: "He gave", rank: 48 },
  { name: "Caleb", gender: "boy", origin: "Hebrew", meaning: "Faithful, whole-hearted", rank: 49 },
  { name: "Ryan", gender: "boy", origin: "Celtic", meaning: "Little king", rank: 50 },
  { name: "Adrian", gender: "boy", origin: "Latin", meaning: "From Hadria, dark one", rank: 51 },
  { name: "Miles", gender: "boy", origin: "Latin", meaning: "Soldier, merciful", rank: 52 },
  { name: "Leo", gender: "boy", origin: "Latin", meaning: "Lion", rank: 53 },
  { name: "Mateo", gender: "boy", origin: "Spanish", meaning: "Gift of God", rank: 54 },
  { name: "Aaron", gender: "boy", origin: "Hebrew", meaning: "High mountain, exalted", rank: 55 },
  { name: "Ezra", gender: "boy", origin: "Hebrew", meaning: "Helper, aid", rank: 56 },
  { name: "Nolan", gender: "boy", origin: "Celtic", meaning: "Champion, noble", rank: 57 },
  { name: "Connor", gender: "boy", origin: "Celtic", meaning: "Lover of hounds", rank: 58 },
  { name: "Jeremiah", gender: "boy", origin: "Hebrew", meaning: "God will uplift", rank: 59 },
  { name: "Easton", gender: "boy", origin: "English", meaning: "East-facing place", rank: 60 },
  { name: "Hunter", gender: "boy", origin: "English", meaning: "One who hunts", rank: 61 },
  { name: "Cameron", gender: "boy", origin: "Celtic", meaning: "Crooked nose", rank: 62 },
  { name: "Colton", gender: "boy", origin: "English", meaning: "Coal town", rank: 63 },
  { name: "Carson", gender: "boy", origin: "English", meaning: "Son of the marsh-dwellers", rank: 64 },
  { name: "Robert", gender: "boy", origin: "Germanic", meaning: "Bright fame", rank: 65 },
  { name: "Angel", gender: "boy", origin: "Greek", meaning: "Messenger of God", rank: 66 },
  { name: "Dominic", gender: "boy", origin: "Latin", meaning: "Belonging to the Lord", rank: 67 },
  { name: "Austin", gender: "boy", origin: "Latin", meaning: "Great, magnificent", rank: 68 },
  { name: "Ian", gender: "boy", origin: "Celtic", meaning: "God is gracious", rank: 69 },
  { name: "Adam", gender: "boy", origin: "Hebrew", meaning: "Man, earth", rank: 70 },
  { name: "Kai", gender: "boy", origin: "Japanese", meaning: "Ocean, shell, forgiveness", rank: 71 },
  { name: "Omar", gender: "boy", origin: "Arabic", meaning: "Flourishing, long-lived", rank: 72 },
  { name: "Ravi", gender: "boy", origin: "Sanskrit", meaning: "Sun, benevolent", rank: 73 },
  { name: "Haruto", gender: "boy", origin: "Japanese", meaning: "Sunlight, soaring", rank: 74 },
  { name: "Aarav", gender: "boy", origin: "Sanskrit", meaning: "Peaceful, wise", rank: 75 },
  { name: "Yusuf", gender: "boy", origin: "Arabic", meaning: "God increases", rank: 76 },
  { name: "Rashid", gender: "boy", origin: "Arabic", meaning: "Rightly guided", rank: 77 },
  { name: "Kofi", gender: "boy", origin: "African", meaning: "Born on Friday", rank: 78 },
  { name: "Emeka", gender: "boy", origin: "African", meaning: "Great deeds", rank: 79 },
  { name: "Marco", gender: "boy", origin: "Italian", meaning: "Warlike, dedicated to Mars", rank: 80 },
  { name: "François", gender: "boy", origin: "French", meaning: "Free man", rank: 81 },
  { name: "Pierre", gender: "boy", origin: "French", meaning: "Rock, stone", rank: 82 },
  { name: "Giovanni", gender: "boy", origin: "Italian", meaning: "God is gracious", rank: 83 },
  { name: "Carlos", gender: "boy", origin: "Spanish", meaning: "Free man", rank: 84 },
  { name: "Diego", gender: "boy", origin: "Spanish", meaning: "Supplanter, teacher", rank: 85 },
  { name: "Arjun", gender: "boy", origin: "Sanskrit", meaning: "Bright, shining, white", rank: 86 },
  { name: "Hiroshi", gender: "boy", origin: "Japanese", meaning: "Generous, prosperous", rank: 87 },
  { name: "Hassan", gender: "boy", origin: "Arabic", meaning: "Handsome, good", rank: 88 },
  { name: "Kwame", gender: "boy", origin: "African", meaning: "Born on Saturday", rank: 89 },
  { name: "Enzo", gender: "boy", origin: "Italian", meaning: "Ruler of the home", rank: 90 },
  { name: "Declan", gender: "boy", origin: "Celtic", meaning: "Full of goodness", rank: 91 },
  { name: "Felix", gender: "boy", origin: "Latin", meaning: "Happy, fortunate", rank: 92 },
  { name: "Hugo", gender: "boy", origin: "Germanic", meaning: "Mind, intellect", rank: 93 },
  { name: "Axel", gender: "boy", origin: "Germanic", meaning: "Father of peace", rank: 94 },
  { name: "Patrick", gender: "boy", origin: "Latin", meaning: "Nobleman, patrician", rank: 95 },
  { name: "Finn", gender: "boy", origin: "Celtic", meaning: "Fair, white, blessed", rank: 96 },
  { name: "Rowan", gender: "boy", origin: "Celtic", meaning: "Little red-haired one", rank: 97 },
  { name: "Nikolai", gender: "boy", origin: "Greek", meaning: "Victory of the people", rank: 98 },
  { name: "Rafael", gender: "boy", origin: "Hebrew", meaning: "God has healed", rank: 99 },
  { name: "Stefan", gender: "boy", origin: "Greek", meaning: "Crown, garland", rank: 100 },

  // ── Girls (100) ──
  { name: "Olivia", gender: "girl", origin: "Latin", meaning: "Olive tree, symbol of peace", rank: 1 },
  { name: "Emma", gender: "girl", origin: "Germanic", meaning: "Whole, universal", rank: 2 },
  { name: "Charlotte", gender: "girl", origin: "French", meaning: "Free woman, petite", rank: 3 },
  { name: "Amelia", gender: "girl", origin: "Germanic", meaning: "Industrious, striving", rank: 4 },
  { name: "Sophia", gender: "girl", origin: "Greek", meaning: "Wisdom", rank: 5 },
  { name: "Isabella", gender: "girl", origin: "Hebrew", meaning: "Pledged to God", rank: 6 },
  { name: "Mia", gender: "girl", origin: "Latin", meaning: "Mine, beloved", rank: 7 },
  { name: "Ava", gender: "girl", origin: "Latin", meaning: "Life, bird-like", rank: 8 },
  { name: "Harper", gender: "girl", origin: "English", meaning: "Harp player", rank: 9 },
  { name: "Luna", gender: "girl", origin: "Latin", meaning: "Moon", rank: 10 },
  { name: "Evelyn", gender: "girl", origin: "English", meaning: "Wished-for child", rank: 11 },
  { name: "Gianna", gender: "girl", origin: "Italian", meaning: "God is gracious", rank: 12 },
  { name: "Aurora", gender: "girl", origin: "Latin", meaning: "Dawn, goddess of morning", rank: 13 },
  { name: "Ella", gender: "girl", origin: "Germanic", meaning: "All, completely, fairy maiden", rank: 14 },
  { name: "Penelope", gender: "girl", origin: "Greek", meaning: "Weaver, faithful wife", rank: 15 },
  { name: "Layla", gender: "girl", origin: "Arabic", meaning: "Night, dark beauty", rank: 16 },
  { name: "Chloe", gender: "girl", origin: "Greek", meaning: "Blooming, verdant", rank: 17 },
  { name: "Willow", gender: "girl", origin: "English", meaning: "Graceful, slender tree", rank: 18 },
  { name: "Aria", gender: "girl", origin: "Italian", meaning: "Air, song, melody", rank: 19 },
  { name: "Ellie", gender: "girl", origin: "Greek", meaning: "Bright shining light", rank: 20 },
  { name: "Nora", gender: "girl", origin: "Celtic", meaning: "Honor, light", rank: 21 },
  { name: "Hazel", gender: "girl", origin: "English", meaning: "The hazelnut tree", rank: 22 },
  { name: "Zoey", gender: "girl", origin: "Greek", meaning: "Life", rank: 23 },
  { name: "Riley", gender: "girl", origin: "Celtic", meaning: "Courageous, valiant", rank: 24 },
  { name: "Victoria", gender: "girl", origin: "Latin", meaning: "Victory, conqueror", rank: 25 },
  { name: "Lily", gender: "girl", origin: "English", meaning: "Lily flower, purity", rank: 26 },
  { name: "Eleanor", gender: "girl", origin: "French", meaning: "Bright, shining one", rank: 27 },
  { name: "Hannah", gender: "girl", origin: "Hebrew", meaning: "Grace, favor", rank: 28 },
  { name: "Lillian", gender: "girl", origin: "Latin", meaning: "Lily, purity and innocence", rank: 29 },
  { name: "Addison", gender: "girl", origin: "English", meaning: "Son of Adam", rank: 30 },
  { name: "Aubrey", gender: "girl", origin: "French", meaning: "Elf ruler, noble", rank: 31 },
  { name: "Stella", gender: "girl", origin: "Latin", meaning: "Star", rank: 32 },
  { name: "Natalie", gender: "girl", origin: "Latin", meaning: "Birthday of the Lord", rank: 33 },
  { name: "Zoe", gender: "girl", origin: "Greek", meaning: "Life", rank: 34 },
  { name: "Leah", gender: "girl", origin: "Hebrew", meaning: "Weary, meadow", rank: 35 },
  { name: "Savannah", gender: "girl", origin: "Spanish", meaning: "Treeless plain", rank: 36 },
  { name: "Audrey", gender: "girl", origin: "English", meaning: "Noble strength", rank: 37 },
  { name: "Brooklyn", gender: "girl", origin: "English", meaning: "Broken land, water", rank: 38 },
  { name: "Claire", gender: "girl", origin: "French", meaning: "Clear, bright, famous", rank: 39 },
  { name: "Skylar", gender: "girl", origin: "English", meaning: "Eternal life, scholar", rank: 40 },
  { name: "Paisley", gender: "girl", origin: "Celtic", meaning: "Church, cemetery", rank: 41 },
  { name: "Elena", gender: "girl", origin: "Greek", meaning: "Bright, shining light", rank: 42 },
  { name: "Naomi", gender: "girl", origin: "Hebrew", meaning: "Pleasantness, delight", rank: 43 },
  { name: "Caroline", gender: "girl", origin: "French", meaning: "Free woman, song of joy", rank: 44 },
  { name: "Eliana", gender: "girl", origin: "Hebrew", meaning: "My God has answered", rank: 45 },
  { name: "Anna", gender: "girl", origin: "Hebrew", meaning: "Grace, favor", rank: 46 },
  { name: "Maya", gender: "girl", origin: "Sanskrit", meaning: "Illusion, magic, great", rank: 47 },
  { name: "Valentina", gender: "girl", origin: "Latin", meaning: "Strength, health", rank: 48 },
  { name: "Ruby", gender: "girl", origin: "Latin", meaning: "Red precious stone", rank: 49 },
  { name: "Kennedy", gender: "girl", origin: "Celtic", meaning: "Helmeted chief", rank: 50 },
  { name: "Ivy", gender: "girl", origin: "English", meaning: "Ivy plant, fidelity", rank: 51 },
  { name: "Ariana", gender: "girl", origin: "Greek", meaning: "Most holy, silver", rank: 52 },
  { name: "Aaliyah", gender: "girl", origin: "Arabic", meaning: "Exalted, sublime", rank: 53 },
  { name: "Cora", gender: "girl", origin: "Greek", meaning: "Maiden, daughter", rank: 54 },
  { name: "Madelyn", gender: "girl", origin: "English", meaning: "High tower, woman of Magdala", rank: 55 },
  { name: "Alice", gender: "girl", origin: "Germanic", meaning: "Noble, exalted", rank: 56 },
  { name: "Kinsley", gender: "girl", origin: "English", meaning: "King's meadow", rank: 57 },
  { name: "Hailey", gender: "girl", origin: "English", meaning: "Hay meadow", rank: 58 },
  { name: "Gabriella", gender: "girl", origin: "Hebrew", meaning: "God is my strength", rank: 59 },
  { name: "Allison", gender: "girl", origin: "Germanic", meaning: "Noble, exalted", rank: 60 },
  { name: "Fatima", gender: "girl", origin: "Arabic", meaning: "Captivating, one who abstains", rank: 61 },
  { name: "Aisha", gender: "girl", origin: "Arabic", meaning: "Living, prosperous", rank: 62 },
  { name: "Priya", gender: "girl", origin: "Sanskrit", meaning: "Beloved, dear one", rank: 63 },
  { name: "Sakura", gender: "girl", origin: "Japanese", meaning: "Cherry blossom", rank: 64 },
  { name: "Yuki", gender: "girl", origin: "Japanese", meaning: "Snow, happiness", rank: 65 },
  { name: "Chiara", gender: "girl", origin: "Italian", meaning: "Light, clear", rank: 66 },
  { name: "Camille", gender: "girl", origin: "French", meaning: "Perfect, unblemished", rank: 67 },
  { name: "Lucia", gender: "girl", origin: "Spanish", meaning: "Light, graceful illumination", rank: 68 },
  { name: "Ananya", gender: "girl", origin: "Sanskrit", meaning: "Unique, matchless", rank: 69 },
  { name: "Amara", gender: "girl", origin: "African", meaning: "Grace, eternal beauty", rank: 70 },
  { name: "Nia", gender: "girl", origin: "African", meaning: "Purpose, radiance", rank: 71 },
  { name: "Zara", gender: "girl", origin: "Arabic", meaning: "Blooming flower, princess", rank: 72 },
  { name: "Freya", gender: "girl", origin: "Germanic", meaning: "Noble woman, Norse goddess of love", rank: 73 },
  { name: "Sienna", gender: "girl", origin: "Italian", meaning: "Reddish-brown, from Siena", rank: 74 },
  { name: "Colette", gender: "girl", origin: "French", meaning: "Victory of the people", rank: 75 },
  { name: "Esme", gender: "girl", origin: "French", meaning: "Esteemed, beloved", rank: 76 },
  { name: "Isla", gender: "girl", origin: "Celtic", meaning: "Island, serene", rank: 77 },
  { name: "Phoebe", gender: "girl", origin: "Greek", meaning: "Bright, radiant, pure", rank: 78 },
  { name: "Rosa", gender: "girl", origin: "Spanish", meaning: "Rose flower", rank: 79 },
  { name: "Genevieve", gender: "girl", origin: "French", meaning: "Woman of the people", rank: 80 },
  { name: "Ingrid", gender: "girl", origin: "Germanic", meaning: "Beautiful, beloved", rank: 81 },
  { name: "Mika", gender: "girl", origin: "Japanese", meaning: "Beautiful fragrance", rank: 82 },
  { name: "Adeola", gender: "girl", origin: "African", meaning: "Crown of honor", rank: 83 },
  { name: "Paloma", gender: "girl", origin: "Spanish", meaning: "Dove, peace", rank: 84 },
  { name: "Adele", gender: "girl", origin: "Germanic", meaning: "Noble, serene", rank: 85 },
  { name: "Francesca", gender: "girl", origin: "Italian", meaning: "Free one, from France", rank: 86 },
  { name: "Devi", gender: "girl", origin: "Sanskrit", meaning: "Goddess, divine", rank: 87 },
  { name: "Saoirse", gender: "girl", origin: "Celtic", meaning: "Freedom, liberty", rank: 88 },
  { name: "Anika", gender: "girl", origin: "Sanskrit", meaning: "Grace, sweet-faced", rank: 89 },
  { name: "Nadia", gender: "girl", origin: "Arabic", meaning: "Hope, tender", rank: 90 },
  { name: "Leilani", gender: "girl", origin: "English", meaning: "Heavenly flower", rank: 91 },
  { name: "Imani", gender: "girl", origin: "African", meaning: "Faith, belief", rank: 92 },
  { name: "Margot", gender: "girl", origin: "French", meaning: "Pearl", rank: 93 },
  { name: "Bianca", gender: "girl", origin: "Italian", meaning: "White, pure", rank: 94 },
  { name: "Clara", gender: "girl", origin: "Latin", meaning: "Clear, bright, famous", rank: 95 },
  { name: "Brielle", gender: "girl", origin: "French", meaning: "God is my strength", rank: 96 },
  { name: "Adelaide", gender: "girl", origin: "Germanic", meaning: "Noble natured", rank: 97 },
  { name: "Thalia", gender: "girl", origin: "Greek", meaning: "To blossom, flourishing", rank: 98 },
  { name: "Selene", gender: "girl", origin: "Greek", meaning: "Moon goddess", rank: 99 },
  { name: "Katarina", gender: "girl", origin: "Greek", meaning: "Pure, clear", rank: 100 },

  // ── Unisex (20) ──
  { name: "Avery", gender: "unisex", origin: "English", meaning: "Ruler of elves", rank: 18 },
  { name: "Jordan", gender: "unisex", origin: "Hebrew", meaning: "To flow down, descend", rank: 25 },
  { name: "Taylor", gender: "unisex", origin: "English", meaning: "Tailor, cutter of cloth", rank: 30 },
  { name: "Morgan", gender: "unisex", origin: "Celtic", meaning: "Sea-born, great circle", rank: 35 },
  { name: "Quinn", gender: "unisex", origin: "Celtic", meaning: "Wise, intelligent", rank: 40 },
  { name: "Casey", gender: "unisex", origin: "Celtic", meaning: "Brave in battle", rank: 45 },
  { name: "Sage", gender: "unisex", origin: "Latin", meaning: "Wise one, herb", rank: 50 },
  { name: "Reese", gender: "unisex", origin: "Celtic", meaning: "Enthusiasm, ardor", rank: 55 },
  { name: "Dakota", gender: "unisex", origin: "English", meaning: "Friendly companion, ally", rank: 60 },
  { name: "Rowan", gender: "unisex", origin: "Celtic", meaning: "Little red-haired one, rowan tree", rank: 42 },
  { name: "River", gender: "unisex", origin: "English", meaning: "Flowing body of water", rank: 48 },
  { name: "Skyler", gender: "unisex", origin: "English", meaning: "Scholar, eternal life", rank: 52 },
  { name: "Phoenix", gender: "unisex", origin: "Greek", meaning: "Mythical bird reborn from ashes", rank: 58 },
  { name: "Finley", gender: "unisex", origin: "Celtic", meaning: "Fair-haired warrior", rank: 62 },
  { name: "Emerson", gender: "unisex", origin: "English", meaning: "Son of Emery, brave", rank: 65 },
  { name: "Hayden", gender: "unisex", origin: "English", meaning: "Hedged valley", rank: 70 },
  { name: "Remy", gender: "unisex", origin: "French", meaning: "Oarsman, remedy", rank: 75 },
  { name: "Ari", gender: "unisex", origin: "Hebrew", meaning: "Lion of God", rank: 80 },
  { name: "Harley", gender: "unisex", origin: "English", meaning: "Hare meadow", rank: 85 },
  { name: "Indigo", gender: "unisex", origin: "English", meaning: "Deep blue-violet dye", rank: 90 },
];

const ALL_ORIGINS: Origin[] = [
  "English", "Latin", "Greek", "Hebrew", "Arabic", "Celtic",
  "Germanic", "Sanskrit", "Japanese", "Spanish", "French", "Italian", "African",
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function genderColor(g: Gender) {
  if (g === "boy") return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", ring: "ring-blue-400" };
  if (g === "girl") return { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", badge: "bg-pink-100 text-pink-700", ring: "ring-pink-400" };
  return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700", ring: "ring-purple-400" };
}

export default function BabyNameGenerator() {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");
  const [selectedOrigins, setSelectedOrigins] = useState<Set<Origin>>(new Set());
  const [startLetter, setStartLetter] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("popularity");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedName, setSelectedName] = useState<BabyName | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);

  const toggleOrigin = useCallback((origin: Origin) => {
    setSelectedOrigins((prev) => {
      const next = new Set(prev);
      if (next.has(origin)) next.delete(origin);
      else next.add(origin);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((name: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let list = NAMES.filter((n) => {
      if (genderFilter !== "all" && n.gender !== genderFilter) return false;
      if (selectedOrigins.size > 0 && !selectedOrigins.has(n.origin)) return false;
      if (startLetter && !n.name.startsWith(startLetter)) return false;
      if (lengthFilter === "short" && n.name.length > 4) return false;
      if (lengthFilter === "medium" && (n.name.length < 5 || n.name.length > 6)) return false;
      if (lengthFilter === "long" && n.name.length < 7) return false;
      if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    if (sortMode === "alpha") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "popularity") {
      list = [...list].sort((a, b) => a.rank - b.rank);
    } else {
      // seeded shuffle for stable rendering
      list = [...list].sort(() => Math.sin(randomSeed + list.length) - 0.5);
    }

    return list;
  }, [genderFilter, selectedOrigins, startLetter, lengthFilter, search, sortMode, randomSeed]);

  const handleRandom = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = Math.floor(Math.random() * filtered.length);
    setSelectedName(filtered[idx]!);
  }, [filtered]);

  const favoriteNames = useMemo(
    () => NAMES.filter((n) => favorites.has(n.name)),
    [favorites],
  );

  // ── Detail modal ──
  if (selectedName) {
    const c = genderColor(selectedName.gender);
    const famous = FAMOUS_PEOPLE[selectedName.name];
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          onClick={() => setSelectedName(null)}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <span aria-hidden="true">←</span> Back to results
        </button>

        <div className={cn("rounded-2xl border-2 p-8", c.border, c.bg)}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{selectedName.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", c.badge)}>
                  {selectedName.gender}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {selectedName.origin}
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleFavorite(selectedName.name)}
              className="text-2xl transition-transform hover:scale-110"
              aria-label={favorites.has(selectedName.name) ? "Remove from favorites" : "Add to favorites"}
            >
              {favorites.has(selectedName.name) ? "❤️" : "🤍"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Meaning</h3>
              <p className="mt-1 text-lg text-gray-800">{selectedName.meaning}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Origin</h3>
              <p className="mt-1 text-gray-800">{selectedName.origin}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Popularity Rank (US 2024)</h3>
              <p className="mt-1 text-gray-800">#{selectedName.rank}</p>
            </div>
            {famous && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Famous People</h3>
                <ul className="mt-1 list-inside list-disc text-gray-800">
                  {famous.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Favorites panel ──
  if (showFavorites) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Saved Names ({favoriteNames.length})
          </h2>
          <button
            onClick={() => setShowFavorites(false)}
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            ← Back to explorer
          </button>
        </div>

        {favoriteNames.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <p className="text-lg text-gray-400">No saved names yet</p>
            <p className="mt-1 text-sm text-gray-400">Tap the heart icon on any name to save it here.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteNames.map((n) => {
              const c = genderColor(n.gender);
              return (
                <div
                  key={n.name}
                  className={cn("group relative cursor-pointer rounded-xl border p-5 transition-shadow hover:shadow-md", c.border, c.bg)}
                  onClick={() => { setShowFavorites(false); setSelectedName(n); }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(n.name); }}
                    className="absolute right-3 top-3 text-lg transition-transform hover:scale-110"
                    aria-label="Remove from favorites"
                  >
                    ❤️
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">{n.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase", c.badge)}>{n.gender}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{n.origin}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{n.meaning}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Main view ──
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of{" "}
          <span className="font-semibold text-gray-800">{NAMES.length}</span> names
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFavorites(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            ❤️ Saved ({favorites.size})
          </button>
          <button
            onClick={handleRandom}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            🎲 Random Name
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search names..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition-shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Gender */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</label>
          <div className="flex flex-wrap gap-2">
            {(["all", "boy", "girl", "unisex"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  genderFilter === g
                    ? g === "boy" ? "bg-blue-600 text-white"
                      : g === "girl" ? "bg-pink-500 text-white"
                      : g === "unisex" ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Origin */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Origin {selectedOrigins.size > 0 && `(${selectedOrigins.size})`}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ORIGINS.map((o) => (
              <button
                key={o}
                onClick={() => toggleOrigin(o)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  selectedOrigins.has(o) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {o}
              </button>
            ))}
            {selectedOrigins.size > 0 && (
              <button
                onClick={() => setSelectedOrigins(new Set())}
                className="px-2 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Starting letter */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Starting Letter</label>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setStartLetter("")}
              className={cn(
                "h-8 w-8 rounded-md text-xs font-semibold transition-colors",
                startLetter === "" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              All
            </button>
            {LETTERS.map((l) => (
              <button
                key={l}
                onClick={() => setStartLetter(startLetter === l ? "" : l)}
                className={cn(
                  "h-8 w-8 rounded-md text-xs font-semibold transition-colors",
                  startLetter === l ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Length & Sort */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Name Length</label>
            <div className="flex gap-1.5">
              {([["all", "All"], ["short", "Short (3-4)"], ["medium", "Medium (5-6)"], ["long", "Long (7+)"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setLengthFilter(val)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    lengthFilter === val ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Sort By</label>
            <div className="flex gap-1.5">
              {([["alpha", "A → Z"], ["popularity", "Popularity"], ["random", "Shuffle"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setSortMode(val); if (val === "random") setRandomSeed(Math.random() * 1000); }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    sortMode === val ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-lg text-gray-400">No names match your filters</p>
          <p className="mt-1 text-sm text-gray-400">Try adjusting the filters above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => {
            const c = genderColor(n.gender);
            const isFav = favorites.has(n.name);
            return (
              <div
                key={n.name + n.gender}
                className={cn(
                  "group relative cursor-pointer rounded-xl border p-5 transition-all hover:shadow-md",
                  c.border, c.bg,
                )}
                onClick={() => setSelectedName(n)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(n.name); }}
                  className="absolute right-3 top-3 text-lg opacity-60 transition-all hover:scale-110 group-hover:opacity-100"
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFav ? "❤️" : "🤍"}
                </button>

                <h3 className="text-lg font-bold text-gray-900">{n.name}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase", c.badge)}>
                    {n.gender}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                    {n.origin}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{n.meaning}</p>
                <p className="mt-2 text-xs text-gray-400">Rank #{n.rank}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
