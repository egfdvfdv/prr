class StrategyManager {
    constructor() {
        this.strategies = this.initStrategies();
        this.enrichStrategies();
    }

    initStrategies() {
        return {
          cot: { title: 'Chain-of-Thought', icon: 'fa-diagram-project', content: `Objectif: Résoudre en raisonnant par étapes.\nProcédure:\n- Décompose le problème.\n- Raisonne étape par étape (brefs intermédiaires).\n- Conclus clairement.\nNote: privilégier concision et exactitude.` },
          thot: { title: 'Thread-of-Thought', icon: 'fa-comments', content: `Objectif: Maintenir un fil cohérent sur plusieurs tours.\nProcédure:\n- Rappelle le contexte utile.\n- Propose le prochain pas.\n- Résume périodiquement les décisions.` },
          ltm: { title: 'Least-to-Most', icon: 'fa-sort-amount-up', content: `Objectif: Aller du simple au complexe.\nProcédure:\n1) Résoudre sous-problèmes faciles.\n2) Composer vers problèmes durs.\n3) Consolider en une solution globale.` },
          tot: { title: 'Tree-of-Thoughts', icon: 'fa-tree', content: `Objectif: Explorer plusieurs pistes.\nProcédure:\n- Génère 2-3 branches.\n- Évalue avantages/inconvénients.\n- Choisis la meilleure et synthétise.` },
          got: { title: 'Graph-of-Thoughts', icon: 'fa-project-diagram', content: `Objectif: Relier des idées en graphe.\nProcédure:\n- Noeuds = idées clés.\n- Arêtes = dépendances.\n- Parcours optimal -> réponse.` },
          sc: { title: 'Self-Consistency', icon: 'fa-check-double', content: `Objectif: Robustesse.\nProcédure:\n- Génére 3+ réponses.\n- Vote majoritaire pour la plus cohérente.` },
          cbp: { title: 'Complexity-Based Prompting', icon: 'fa-layer-group', content: `Objectif: Favoriser prompts à chaînes profondes.\nProcédure:\n- Inclure exemples complexes.\n- Forcer la justification multi-étapes.` },
          react: { title: 'ReAct', icon: 'fa-brain', content: `Objectif: Alterner Raisonnement/Action.\nBoucle:\n- Raisonnement (court)\n- Action (recherche, outil)\n- Observation\nRépéter jusqu'à solution.` },
          rap: { title: 'Reasoning via Planning', icon: 'fa-chess-knight', content: `Objectif: Planifier (MCTS/plan).\nProcédure:\n- Modéliser états et actions.\n- Simuler branches (coût/bénéfice).\n- Exécuter le meilleur plan.` },
          pal: { title: 'Program-Aided (PAL)', icon: 'fa-terminal', content: `Objectif: Confier calculs à un programme.\nProcédure:\n- Décomposer en sous-étapes.\n- Déléguer calcul à Python/outil.\n- Intégrer résultats.` },
          stepback: { title: 'Step-Back', icon: 'fa-arrow-rotate-left', content: `Objectif: Abstraction d’abord.\nProcédure:\n- Exprimer principes généraux.\n- Appliquer aux détails.\n- Éviter erreurs locales.` },
          ap: { title: 'Analogical Prompting', icon: 'fa-link', content: `Objectif: Générer des analogies.\nProcédure:\n- Créer exemple analogue pertinent.\n- Transférer structure à la cible.` },
          gkp: { title: 'Generated Knowledge', icon: 'fa-book-open', content: `Objectif: Rappeler connaissances.\nProcédure:\n- Générer facts/definitions utiles.\n- Utiliser ces connaissances pour répondre.` },
          s2a: { title: 'System 2 Attention', icon: 'fa-filter', content: `Objectif: Filtrer contexte.\nProcédure:\n- Retenir seulement infos pertinentes.\n- Ignorer distractions/biais.` },
          dsp: { title: 'Directional Stimulus', icon: 'fa-compass', content: `Objectif: Stimuli guidés.\nProcédure:\n- Générer indices directionnels.\n- Orienter vers sortie désirée.` },
          active: { title: 'Active Prompting', icon: 'fa-question', content: `Objectif: Sélection active.\nProcédure:\n- Identifier incertitudes.\n- Poser questions ciblées.\n- Affiner le prompt.` },
          reflexion: { title: 'Reflexion Prompting', icon: 'fa-rotate', content: `Objectif: Auto-révision.\nProcédure:\n- Générer brouillon.\n- Critiquer et améliorer.\n- Livrer version révisée.` },
          meta: { title: 'Meta-Prompting', icon: 'fa-infinity', content: `Objectif: Améliorer le prompt lui-même.\nProcédure:\n- Analyser le prompt.\n- Proposer réécriture.\n- Itérer.` },
          bootstrap: { title: 'Bootstrap Prompting', icon: 'fa-seedling', content: `Objectif: Amorçage itératif.\nProcédure:\n- Générer -> corriger -> régénérer.\n- Réduire erreurs sans annotation.` },
          vae: { title: 'Verify-and-Edit', icon: 'fa-user-check', content: `Objectif: Vérifier puis éditer.\nProcédure:\n- Étape 1: génération.\n- Étape 2: vérification systématique.\n- Édits ciblés.` },
          recursive: { title: 'Recursive Prompting', icon: 'fa-rotate-left', content: `Objectif: Raffinements successifs.\nProcédure:\n- Fournir feedback séquentiel.\n- Améliorer à chaque itération.` },
          sot: { title: 'Skeleton-of-Thought', icon: 'fa-sitemap', content: `Objectif: Générer d’abord un squelette.\nProcédure:\n- Lister points clés.\n- Développer chaque point en parallèle.` },
          scratchpad: { title: 'Scratchpad', icon: 'fa-list-ul', content: `Objectif: Montrer le travail.\nProcédure:\n- Tenir un espace de calcul.\n- Consigner étapes intermédiaires.` },
          chain: { title: 'Prompt Chaining', icon: 'fa-link', content: `Objectif: Chaîner des prompts.\nProcédure:\n- Décomposer en sous-prompts.\n- Faire circuler les sorties.` },
          persona: { title: 'Role/Persona', icon: 'fa-user-tie', content: `Objectif: Adopter un rôle.\nProcédure:\n- Définir expertise/ton.\n- Adapter style et contraintes.` },
          emotion: { title: 'Emotion Prompting', icon: 'fa-face-smile', content: `Objectif: Nuance émotionnelle.\nProcédure:\n- Injecter signaux émotionnels.\n- Rester approprié et utile.` },
          cont: { title: 'Contrastive', icon: 'fa-scale-balanced', content: `Objectif: Comparer options.\nProcédure:\n- Générer alternatives.\n- Argumenter choix.` },
          mai: { title: 'Maieutic', icon: 'fa-comments', content: `Objectif: Socratique.\nProcédure:\n- Questionner pour faire émerger.\n- Guidage structuré.` },
          mmcot: { title: 'Multimodal CoT', icon: 'fa-image', content: `Objectif: Raisonnement multimodal.\nProcédure:\n- Étapes: raisonner -> répondre.\n- Intégrer texte + vision.` }
        };
    }

    enrichStrategies() {
        const generic = (title) => `But: Appliquer la stratégie ${title} avec rigueur et traçabilité.\nEntrées:\n- Contexte du problème\n- Contraintes/objectif mesurable\n- Données d'appui si disponibles\n\nProcédure détaillée:\n1) Reformuler le problème et le cadrer en 1-2 phrases.\n2) Établir hypothèses clés et critères de succès.\n3) Exécuter la méthode ${title} pas à pas en limitant les sauts logiques.\n4) Produire une sortie structurée avec décisions justifiées.\n\nHeuristiques d'arrêt:\n- Les critères de succès sont satisfaits\n- Plus d'amélioration marginale visible\n\nVérifications qualité:\n- Cohérence globale et absence de contradictions\n- Traçabilité des étapes, formatage propre\n- Réponse actionnable et mesurable\n\nModes:\n- Compact: 5-8 lignes, essentiel et directement exploitable\n- Exhaustif: tous les raisonnements et alternatives utiles\n\nAnti-patterns:\n- Verbiage non justifié, étapes opaques, conclusions non fondées.`;

        const playbooks = {
          cot: `But: Résolution par raisonnement explicite (Chain-of-Thought).\nPré-requis:\n- Objectif clair + métriques\n- Contraintes explicites\n\nÉtapes:\n1) Décomposer le problème en sous-problèmes atomiques.\n2) Résoudre chaque sous-problème avec justification.\n3) Réconcilier les résultats et expliciter les compromis.\n4) Formuler la réponse finale avec résumé et prochaines actions.\n\nQualité:\n- Chaque étape doit avoir une raison et un résultat.\n- Pas de saut logique.\n\nSortie:\n- Bref récapitulatif, étapes numérotées, solution finale.\n- Bloc JSON optionnel des décisions clés: {"hypotheses":[], "steps":[], "decision":"..."}.`,
          // ... (other playbooks from features.txt could be added here)
        };

        Object.entries(this.strategies).forEach(([k, it]) => {
          const extra = playbooks[k] || generic(it.title);
          const resume = it.content || '';
          it.content = `${resume}\n\n====================\nPLAYBOOK DÉTAILLÉ\n====================\n${extra}\n\nChecklist de sortie:\n- [ ] Objectif satisfait\n- [ ] Étapes traçables\n- [ ] Critères/mesures fournis\n- [ ] Décisions justifiées\n- [ ] Prochaines actions claires`;
        });
    }

    getStrategies() {
        return this.strategies;
    }

    getStrategy(key) {
        return this.strategies[key];
    }
}
