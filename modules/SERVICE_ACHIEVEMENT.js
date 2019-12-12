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

var API = Spark.getGameDataService();
var colPlayerAchievement = "playerAchievement";

function FilterAchievements(type)
{
    var achievements = {};
    for (var achievementId in gameDatabase.achievements) {
        var achievement = gameDatabase.achievements[achievementId];
        if (achievement.type == type) {
            achievements[achievementId] = achievement;
        }
    }
}

function FilterPlayerAchievements(achievements, playerAchievements)
{
    var result = {};
    for (var i = 0; i < playerAchievements.length; ++i) {
    var playerAchievement = playerAchievements[i];
        if (achievements.hasOwnProperty(playerAchievement.DataId))
            result[playerAchievement.DataId] = playerAchievement;
    }
    return result;
}

function UpdateTotalClearStage(playerId, playerAchievements, playerClearStages)
{
    var achievements = FilterAchievements(AchievementType.TotalClearStage);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = new PlayerAchievement();
            newPlayerAchievement.playerId = playerId;
            newPlayerAchievement.dataId = achievementId;
            newPlayerAchievement.progress = playerClearStages.Count;
            createPlayerAchievements.Add(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            oldPlayerAchievement.progress = playerClearStages.Count;
            updatePlayerAchievements.Add(oldPlayerAchievement);
        }
    }
}

function UpdateTotalClearStageRating(playerId, playerAchievements, playerClearStages)
{
    var achievements = FilterAchievements(AchievementType.TotalClearStageRating);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    var countRating = 0;
    for (var i = 0; i < playerClearStages.length; ++i)
    {
        countRating += playerClearStages[i].BestRating;
    }
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = new PlayerAchievement();
            newPlayerAchievement.playerId = playerId;
            newPlayerAchievement.dataId = achievementId;
            newPlayerAchievement.progress = countRating;
            createPlayerAchievements.Add(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            oldPlayerAchievement.progress = countRating;
            updatePlayerAchievements.Add(oldPlayerAchievement);
        }
    }
}

function UpdateCountLevelUpCharacter(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountLevelUpCharacter);
}

function UpdateCountLevelUpEquipment(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountLevelUpEquipment);
}

function UpdateCountEvolveCharacter(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountEvolveCharacter);
}

function UpdateCountEvolveEquipment(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountEvolveEquipment);
}

function UpdateCountRevive(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountRevive);
}

function UpdateCountUseHelper(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountUseHelper);
}

function UpdateCountWinStage(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountWinStage);
}

function UpdateCountWinDuel(playerId, playerAchievements)
{
    UpdateCountingProgress(playerId, playerAchievements, AchievementType.CountWinDuel);
}

function UpdateCountingProgress(playerId, playerAchievements, type)
{
    var achievements = FilterAchievements(type);
    var playerAchievementDict = FilterPlayerAchievements(achievements, playerAchievements);
    for (var achievementId in achievements)
    {
        if (!playerAchievementDict.hasOwnProperty(achievementId))
        {
            var newPlayerAchievement = {}
            newPlayerAchievement.playerId = playerId;
            newPlayerAchievement.dataId = achievementId;
            newPlayerAchievement.progress = 1;
            createPlayerAchievements.Add(newPlayerAchievement);
        }
        else
        {
            var oldPlayerAchievement = playerAchievementDict[achievementId];
            ++oldPlayerAchievement.progress;
            updatePlayerAchievements.Add(oldPlayerAchievement);
        }
    }
}