// ====================================================================================================
//
// Cloud Code for SERVICE_ACHIEVEMENT, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================
// MIT License
// Copyright (c) 2018 Ittipon Teerapruettikulchai
// ====================================================================================================
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// ====================================================================================================
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// ====================================================================================================
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ====================================================================================================

function FilterAchievements(type)
{
    var achievements = {};
    for (var achievementId in gameDatabase.achievements) {
        var achievement = gameDatabase.achievements[achievementId];
        if (achievement.type == type) {
            achievements[achievementId] = achievement;
        }
    }
    return achievements;
}

function FilterPlayerAchievements(achievements, playerAchievements)
{
    var result = {};
    for (var i = 0; i < playerAchievements.length; ++i) {
    var playerAchievement = playerAchievements[i];
        if (achievements.hasOwnProperty(playerAchievement.dataId))
            result[playerAchievement.DataId] = playerAchievement;
    }
    return result;
}

function UpdateTotalClearStage(playerId, playerAchievements, playerClearStages)
{
    var createPlayerAchievements = [];
    var updatePlayerAchievements = [];
    var achievements = FilterAchievements(ENUM_TOTAL_CLEAR_STAGE);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = CreatePlayerUnlockItem(playerId, achievementId);
            newPlayerAchievement.progress = playerClearStages.length;
            createPlayerAchievements.push(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            oldPlayerAchievement.progress = playerClearStages.length;
            updatePlayerAchievements.push(oldPlayerAchievement);
        }
    }
    return {
        createAchievements: createPlayerAchievements,
        updateAchievements: updatePlayerAchievements
    }
}

function UpdateTotalClearStageRating(playerId, playerAchievements, playerClearStages)
{
    var createPlayerAchievements = [];
    var updatePlayerAchievements = [];
    var achievements = FilterAchievements(ENUM_TOTAL_CLEAR_STAGE_RATING);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    var countRating = 0;
    for (var i = 0; i < playerClearStages.length; ++i)
    {
        countRating += playerClearStages[i].bestRating;
    }
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = CreatePlayerUnlockItem(playerId, achievementId);
            newPlayerAchievement.progress = countRating;
            createPlayerAchievements.push(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            oldPlayerAchievement.progress = countRating;
            updatePlayerAchievements.push(oldPlayerAchievement);
        }
    }
    return {
        createAchievements: createPlayerAchievements,
        updateAchievements: updatePlayerAchievements
    }
}

function UpdateCountLevelUpCharacter(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_LEVEL_UP_CHARACTER);
}

function UpdateCountLevelUpEquipment(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_LEVEL_UP_EQUIPMENT);
}

function UpdateCountEvolveCharacter(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_EVOLVE_CHARACTER);
}

function UpdateCountEvolveEquipment(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_EVOLVE_EQUIPMENT);
}

function UpdateCountRevive(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_REVIVE);
}

function UpdateCountUseHelper(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_USE_HELPER);
}

function UpdateCountWinStage(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_WIN_STAGE);
}

function UpdateCountWinDuel(playerId, playerAchievements)
{
    return UpdateCountingProgress(playerId, playerAchievements, ENUM_COUNT_WIN_DUEL);
}

function UpdateCountingProgress(playerId, playerAchievements, type)
{
    var createPlayerAchievements = [];
    var updatePlayerAchievements = [];
    var achievements = FilterAchievements(type);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = CreatePlayerUnlockItem(playerId, achievementId);
            newPlayerAchievement.progress = 1;
            createPlayerAchievements.push(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            ++oldPlayerAchievement.progress;
            updatePlayerAchievements.push(oldPlayerAchievement);
        }
    }
    return {
        createAchievements: createPlayerAchievements,
        updateAchievements: updatePlayerAchievements
    }
}