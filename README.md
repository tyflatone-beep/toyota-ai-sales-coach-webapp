# TOYOTA AI Sales Coach — Application web (API Gemini)

Petite application web autonome : une page de chat qui appelle directement l'API Google Gemini, avec le prompt système et les 4 fichiers de connaissances déjà intégrés. Une fois déployée, elle a sa **propre adresse web** (ex. `https://toyota-ai-sales-coach.onrender.com`) — c'est cette adresse qu'on mettra dans le QR code, plus besoin de passer par ChatGPT ou Gemini directement.

## Contenu du dépôt

```
toyota-ai-sales-coach-webapp/
├── server.js              → le serveur (reçoit les messages, appelle l'API Gemini, renvoie la réponse)
├── public/index.html      → l'interface de chat (page servie au conseiller)
├── content/                → copies de SYSTEM_PROMPT.md + les 4 fichiers de connaissances, chargées au démarrage
├── package.json
├── .gitignore
└── .env.example            → modèle des variables d'environnement (à renseigner sur Render, jamais dans le code)
```

## Étape 1 — Obtenir une clé API Gemini (gratuite)

1. Allez sur [aistudio.google.com](https://aistudio.google.com) et connectez-vous avec votre compte Google.
2. Cliquez sur **Get API key** (ou l'icône clé dans le menu de gauche) puis **Create API key**.
3. Choisissez de créer une clé sans projet Google Cloud existant si on vous le propose (le plus simple).
4. Copiez la clé générée (une longue chaîne de caractères) et gardez-la de côté — **ne la collez jamais dans un message de conversation ni sur GitHub**, uniquement dans Render à l'étape 3.

## Étape 2 — Déployer sur Render

1. Sur votre tableau de bord Render, cliquez sur **New +** → **Web Service**.
2. Connectez votre dépôt GitHub `toyota-ai-sales-coach-webapp`.
3. Renseignez :
   - **Build Command :** `npm install`
   - **Start Command :** `npm start`
   - **Instance Type :** Free
4. Dans l'onglet **Environment**, ajoutez deux variables :
   - `GEMINI_API_KEY` → collez la clé obtenue à l'étape 1
   - `GEMINI_MODEL` → `gemini-3.5-flash` (voir note ci-dessous si erreur)
5. Cliquez sur **Create Web Service**. Le premier déploiement prend 2-3 minutes.
6. Une fois prêt, Render affiche votre adresse publique, du type `https://toyota-ai-sales-coach-webapp.onrender.com`.

## Étape 3 — Tester

Ouvrez l'adresse fournie par Render dans votre navigateur, cliquez sur **Démarrer la formation** et vérifiez que le message d'accueil s'affiche, puis testez un module.

**Si vous obtenez une erreur mentionnant le modèle** (« model not found » ou équivalent) : les noms de modèles Gemini évoluent régulièrement. Allez dans [Google AI Studio](https://aistudio.google.com), section modèles, notez le nom exact d'un modèle "flash" disponible sur le niveau gratuit, puis mettez à jour la variable `GEMINI_MODEL` dans Render (onglet Environment) avec ce nom exact — pas besoin de retoucher au code, Render redéploie automatiquement.

## À savoir

- **Démarrage à froid (plan gratuit Render) :** si personne n'a utilisé l'application depuis 15 minutes, elle se met en veille et le premier message peut prendre 30 à 50 secondes avant de répondre. C'est normal, pas un bug — les messages suivants sont rapides.
- **Pas de mot de passe :** toute personne qui a le lien (ou scanne le QR code) peut discuter avec le coach, sans identification préalable au-delà du prénom/concession demandés par le prompt. Si vous voulez restreindre l'accès plus tard (code d'accès, authentification), dites-le-moi, on l'ajoutera.
- **Historique de conversation :** conservé uniquement dans le navigateur du conseiller pendant sa session ; rien n'est stocké sur le serveur.
- **Mise à jour du contenu :** si vous modifiez `SYSTEM_PROMPT.md` ou les fichiers de scoring, remplacez-les dans le dossier `content/` de ce dépôt et redéployez sur Render — un nouveau commit sur GitHub déclenche automatiquement un redéploiement.

