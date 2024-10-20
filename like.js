function calculateIDF(games) {
    let totalGames = Object.keys(games).length;
    let tagCounts = {};

    // Count the number of games each tag appears in (mechanics)
    Object.values(games).forEach(game => {
        let tags = new Set([...game.mechanics]);
        tags.forEach(tag => {
            if (!tagCounts[tag]) tagCounts[tag] = 0;
            tagCounts[tag]++;
        });
    });

    // Calculate the IDF for each tag
    let idf = {};
    for (let tag in tagCounts) {
        idf[tag] = Math.log(totalGames / (1 + tagCounts[tag])); // Add 1 to avoid division by zero
    }

    return idf;
}

// Calculate TF (Term Frequency) for combined mechanics and categories
function calculateTF(tags) {
    let tagFrequency = {};
    tags.forEach(tag => {
        if (!tagFrequency[tag]) tagFrequency[tag] = 0;
        tagFrequency[tag]++;
    });

    let tf = {};
    let totalTags = tags.length;
    for (let tag in tagFrequency) {
        tf[tag] = tagFrequency[tag] / totalTags; // Normalize by total number of tags
    }

    return tf;
}

// Create a TF-IDF vector for a game's combined mechanics and categories
function createTfIdfVector(tags, idf) {
    let tf = calculateTF(tags);
    let tfIdf = {};
    tags.forEach(tag => {
        tfIdf[tag] = tf[tag] * (idf[tag] || 0); // Multiply TF by IDF
    });
    return tfIdf;
}

// Compute Cosine similarity between two TF-IDF vectors
function cosineSimilarity(tfIdfA, tfIdfB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    let allTags = new Set([...Object.keys(tfIdfA), ...Object.keys(tfIdfB)]);

    allTags.forEach(tag => {
        let valA = tfIdfA[tag] || 0;
        let valB = tfIdfB[tag] || 0;
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
    });

    if (magnitudeA === 0 || magnitudeB === 0) return 0; // To handle division by zero

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// Calculate similarity scores for all games
function calculateSimilarity(selected, games) {
    let idf = calculateIDF(games);

    // Aggregate mechanics and categories from the selected games
    let selectedTags = selected.flatMap(id => [...games[id].mechanics]);

    // Create a combined TF-IDF vector for the selected games
    let selectedTfIdfVector = createTfIdfVector(selectedTags, idf);

    let similarityScores = {};

    // Calculate similarity for each non-selected game
    for (let gameId in games) {
        if (!selected.includes(parseInt(gameId))) {
            let game = games[gameId];
            let gameTags = [...game.mechanics];
            let gameTfIdfVector = createTfIdfVector(gameTags, idf);
            let similarity = cosineSimilarity(selectedTfIdfVector, gameTfIdfVector);
            similarityScores[gameId] = similarity;
        }
    }

    return similarityScores;
}

function sortSimilarityScores(similarityScores) {
    return Object.entries(similarityScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by similarity score in descending order
        .map(([gameId, score]) => ({ gameId: parseInt(gameId), score })); // Return sorted array with gameId and score
}


function scoreLike(selected){
	sortedScores = sortSimilarityScores(calculateSimilarity(selected, games));

	likeList = sortedScores.map(id => id.gameId)

	filterGames()
}
