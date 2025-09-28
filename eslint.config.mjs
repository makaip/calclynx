import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: {
        ...globals.browser,

        MQ: "readonly",
        MathQuill: "readonly",
        $: "readonly",
        jQuery: "readonly",
        supabase: "readonly",
        supabaseClient: "readonly",

        mgTrans: "readonly",
        mgCalculate: "readonly",
        mgCalc: "readonly",

        userManager: "readonly"
      }
    } 
  },
]);
