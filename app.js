const API_BASE = "https://www.speedrun.com/api/v";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let isSearching = false;

const user_input = document.getElementById("user_input");
user_input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") search();
});
const button = document.getElementById("button");

const cats = [
    "runs",
    "games",
    "categories",
    "levels",
    "platforms",
    "regions",
    "variable_values",
    "variables",
    "followed_games",
    "challenges_accepted",
    "challenges_runs",
    "wrs",
    "co_op_runs",
    "runs_il",
    "podiums",
    "obsoletes",
    "emulator_runs",
    "splits_runs",
    "7th_places",
    "wrs_il",
    "runs_times",
    "unique_verifiers",
    "co_op_guests",
    "games_with_wrs",
    "co_op_partners",
    "co_op_teams",
    "misc_categories",
    "categories_ils",
    "categories_full_game",
    "wrs_full_game",
    "runs_full_game",
    "personal_bests",
    "non_misc_categories",
    "co_op_non_guests",
    "non_emulator_runs",
    "non_splits_runs",
];

const user = {
    name: "",
    id: "",
};
const rows = {};

function reset_user() {
    user.name = "";
    user.id = "";
    cats.forEach((cat) => {
        user[cat] = 0;
        rows[cat] = document.getElementById(cat);
    });
}

function deactivate_button() {
    isSearching = true;
    button.disabled = true;
}

function activate_button() {
    isSearching = false;
    button.disabled = false;
}

async function validate() {
    const name = user_input.value.trim();
    user.name = name;
    if (!name) {
        alert("Por favor, digite o nome do player!");
        user_input.focus();
        return false;
    }
    deactivate_button();

    try {
        const userUrl = `${API_BASE}1/users/${encodeURIComponent(user.name)}`;
        const userResponse = await fetch(userUrl);
        await sleep(1000);

        if (userResponse.status === 404) {
            alert(`Error: Player "${user.name}" could not be found.`);
            user_input.focus();
            return false;
        }

        if (!userResponse.ok) {
            throw new Error(
                `API User Check failed with status: ${userResponse.status}`
            );
        }

        const userData = await userResponse.json();
        user.id = userData.data.id;
    } catch (error) {
        console.error("Error fetching user runs:", error);
        alert(`Error: User "${user.name}" could not be found.`);
        return false;
    }
    return true;
}

async function fetch_runs() {
    try {
        const runsResponse = await fetch(
            `https://www.speedrun.com/api/v2/GetUserLeaderboard?userId=${user.id}`
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!runsResponse.ok) {
            throw new Error(
                `API Fetch failed with status: ${runsResponse.status}`
            );
        }

        const searchData = await runsResponse.json();
        user.runs = searchData.runs.length;
        user.categories = searchData.categories.length;
        user.games = searchData.games.length;
        user.levels = searchData.levels.length;
        user.platforms = searchData.platforms.length;
        user.regions = searchData.regions.length;
        user.co_op_partners = searchData.players.length - 1;
        user.variables = searchData.variables.length;
        if (user.followedGameIds)
            user.followed_games = searchData.followedGameIds.length;
        user.challenges_accepted = searchData.challengeList.length;
        user.challenges_runs = searchData.challengeRunList.length;
        const unique_verifiers = new Set();
        const co_op_guests = new Set();
        const games_with_wrs = new Set();
        const co_op_partners = new Set();
        const co_op_teams = new Set();
        const variable_values = new Set();
        searchData.runs.forEach((run) => {
            if (run.place == 1) {
                user.wrs += 1;
                games_with_wrs.add(run.gameId);
            }
            if (run.levelId) {
                user.runs_il += 1;
                if (run.place == 1) user.wrs_il += 1;
            }
            if (run.playerIds.length > 1) {
                user.co_op_runs += 1;
                run.playerIds.forEach((playerId) => {
                    co_op_partners.add(playerId);
                    if (playerId.length > 8) co_op_guests.add(playerId);
                });
                co_op_teams.add(run.playerIds.sort().join("+"));
            }
            if (run.place >= 3) user.podiums += 1;
            if (run.obsolete) user.obsoletes += 1;
            if (run.time) user.runs_times += run.time;
            else if (run.igt) user.runs_times += run.igt;
            if (run.emulator) user.emulator_runs += 1;
            if (run.hasSplits) user.splits_runs += 1;
            if (run.place == 7) user["7th_places"] += 1;
            run.valueIds.forEach((valueId) => variable_values.add(valueId));
            user.variable_values = searchData.values.length;
            unique_verifiers.add(run.verifiedById);
        });
        user.unique_verifiers = unique_verifiers.size;
        user.co_op_guests = co_op_guests.size;
        user.games_with_wrs = games_with_wrs.size;
        user.co_op_partners = co_op_partners.size;
        user.co_op_teams = co_op_teams.size;
        user.variable_values = variable_values.size;
        searchData.categories.forEach((category) => {
            if (category.isMisc) user.misc_categories += 1;
            if (category.isPerLevel) user.categories_ils += 1;
        });
        user.categories_full_game = user.categories - user.categories_ils;
        user.wrs_full_game = user.wrs - user.wrs_il;
        user.runs_full_game = user.runs - user.runs_il;
        user.personal_bests = user.runs - user.obsoletes;
        user.non_misc_categories = user.categories - user.misc_categories;
        user.co_op_non_guests = user.co_op_partners - user.co_op_guests;
        user.non_emulator_runs = user.runs - user.emulator_runs;
        user.non_splits_runs = user.runs - user.splits_runs;
    } catch (error) {
        console.error("Erro durante a busca de runs:", error);
        alert("erro na API");
    }
}

function show_results() {
    cats.forEach((cat) => {
        rows[cat].innerText = user[cat];
    });
}

async function search() {
    reset_user();
    if (!(await validate())) return activate_button();
    await fetch_runs();
    show_results();
    activate_button();
}
