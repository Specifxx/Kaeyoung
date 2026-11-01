// KaeYoung's forum settings (the rules are in ./core.ts, docs/forum.md).
import type { ForumSite } from "./core";

export const FORUM_SITE: ForumSite = {
  site: "kaeyoung",
  siteName: "KaeYoung",
  repo: "Specifxx/Kaeyoung",
  hosts: ["kaeyoung.com", "www.kaeyoung.com"],
  base: "/forum",
  topic: "K-beauty",
  intro: "Swap K-beauty routines, product finds and good prices with other skincare lovers.",
  categories: [
    {
      "key": "routines",
      "name": "Routines & recommendations",
      "blurb": "Your routine, what to try next and what actually worked.",
      "prompts": [
        "Your current morning routine?",
        "A product you would repurchase forever?"
      ]
    },
    {
      "key": "deals",
      "name": "Deals & where to buy",
      "blurb": "Good prices you spotted, store experiences and shipping times.",
      "prompts": [
        "Which store shipped fastest to you?",
        "Best sunscreen price you found this month"
      ]
    },
    {
      "key": "concerns",
      "name": "Skin concerns",
      "blurb": "Oily, dry, sensitive or acne-prone: what helped you (not medical advice).",
      "prompts": [
        "What helped your sensitive skin settle?",
        "Gentle cleanser picks for oily skin?"
      ]
    },
    {
      "key": "suncare",
      "name": "Sunscreen talk",
      "blurb": "Finishes, white cast and favourites for every skin tone.",
      "prompts": [
        "No-white-cast picks for deeper skin tones?",
        "Best sunscreen under makeup?"
      ]
    },
    {
      "key": "site",
      "name": "Site feedback",
      "blurb": "Ideas, bugs or a store we should add.",
      "prompts": [
        "A store we should compare"
      ]
    }
  ],
  reserved: ["kyoung", "k young", "kaeyoung"],
};
