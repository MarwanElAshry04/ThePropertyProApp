// Maps user selections from onboarding to API-compatible format

export const mapBudgetToEGP = (budgetId) => {
    const budgetMap = {
        1: { min: 0, max: 3000000 },           // Under $200K
        2: { min: 3000000, max: 6000000 },     // $200K-$400K
        3: { min: 6000000, max: 12000000 },    // $400K-$750K
        4: { min: 12000000, max: 100000000 },  // Over $750K
    };
    return budgetMap[budgetId] || { min: 0, max: 100000000 };
};

export const mapInvestmentStatus = (statusId) => {
    const statusMap = {
        1: "Getting started",
        2: "Few properties",
        3: "Experienced investor"
    };
    return statusMap[statusId] || "Getting started";
};

export const mapInvestmentGoal = (goalId) => {
    const goalMap = {
        1: "Long-term growth",
        2: "Rental income",
        3: "Both"
    };
    return goalMap[goalId] || "Long-term growth";
};

export const buildSearchQuery = (investmentGoal) => {
    const queryMap = {
        "Long-term growth": "properties in growing areas with high appreciation potential",
        "Rental income": "properties with high rental income potential and good rental yields",
        "Both": "balanced investment properties with rental income and growth potential"
    };
    return queryMap[investmentGoal] || "properties in Egypt";
};