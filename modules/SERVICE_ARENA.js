// ====================================================================================================
//
// Cloud Code for SERVICE_ARENA, write your code here to customize the GameSparks platform.
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
var colPlayerItem = "playerItem";
var colPlayerStamina = "playerStamina";
var colPlayerBattle = "playerBattle";

function StartDuel(targetPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerBattle, 
        API.S("playerId").eq(playerId).and(API.N("battleResult").eq(ENUM_BATTLE_RESULT_NONE)).and(API.N("battleType").eq(ENUM_BATTLE_TYPE_ARENA)),
        API.sort("id", false));
    var result = queryResult.cursor();
    while (result.hasNext())
    {
        result.next().delete();
    }
    if (!DecreasePlayerStamina(playerId, "ARENA", 1))
    {
        Spark.setScriptData("error", ERROR_NOT_ENOUGH_ARENA_STAMINA);
    }
    else
    {
        var session = playerId + "_" + targetPlayerId + "_" + Date.now();
        var newData = CreatePlayerBattle(playerId, targetPlayerId, session);
        var opponent = GetPlayer(targetPlayerId);
        var id = newData.id;
        var newEntry = API.createItem(colPlayerBattle, id);
        newEntry.setData(newData);
        newEntry.persistor().persist().error();
        var staminaTable = gameDatabase.staminas["ARENA"];
        var stamina = GetStamina(playerId, staminaTable.id);
        Spark.setScriptData("stamina", stamina);
        Spark.setScriptData("session", session);
        
        var opponentCharacters = [];
        var selectedArenaFormation = opponent.selectedArenaFormation;
        var opponentCharacterIds = GetFormationCharacterIds(opponent.id, selectedArenaFormation);
        var count = opponentCharacterIds.length;
        for (var i = 0; i < count; ++i)
        {
            var characterId = opponentCharacterIds[i];
            var characterQueryResult = API.getItem(colPlayerItem, characterId);
            var characterEntry = characterQueryResult.document();
            if (characterEntry)
            {
                opponentCharacters.push(characterEntry.getData());
            }
        }
        Spark.setScriptData("opponentCharacters", opponentCharacters);
    }
}

function FinishDuel(session, battleResult, deadCharacters)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerBattle, 
        API.S("playerId").eq(playerId).and(API.S("session").eq(session)),
        API.sort("id", false));
    var result = queryResult.cursor();
    if (!result.hasNext())
    {
        Spark.setScriptData("error", ERROR_INVALID_BATTLE_SESSION);
    }
    else
    {
        var battleEntry = result.next();
        var battle = battleEntry.getData();
        // Prepare results
        var rewardItems = [];
        var createItems = [];
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var rewardSoftCurrency = 0;
        var rewardHardCurrency = 0;
        var rating = 0;
        var updateScore = 0;
        var arenaScore = player.getScriptData("arenaScore");
        var arenaRank = GetArenaRank(arenaScore);
        // Set battle session
        battle.battleResult = battleResult;
        if (battleResult == ENUM_BATTLE_RESULT_WIN)
        {
            rating = 3 - deadCharacters;
            if (rating <= 0)
                rating = 1;
        }
        battle.rating = rating;
        battleEntry.setData(battle);
        battleEntry.persistor().persist().error();
        if (battleResult == ENUM_BATTLE_RESULT_WIN)
        {
            var oldArenaLevel = CalculateArenaRankLevel(arenaScore);
            var highestArenaRank = player.getScriptData("highestArenaRank");
            var highestArenaRankCurrentSeason = player.getScriptData("highestArenaRankCurrentSeason");
            updateScore = gameDatabase.arenaWinScoreIncrease;
            arenaScore += gameDatabase.arenaWinScoreIncrease;
            player.setScriptData("arenaScore", arenaScore);
            var arenaLevel = CalculateArenaRankLevel(arenaScore);
            // Arena rank up, rewarding items
            if (arenaRank && arenaLevel > oldArenaLevel && highestArenaRankCurrentSeason < arenaLevel)
            {
                // Update highest rank
                player.setScriptData("highestArenaRankCurrentSeason", arenaLevel);
                if (highestArenaRank < arenaLevel)
                    player.setScriptData("highestArenaRank", arenaLevel);
                    
                // Soft currency
                rewardSoftCurrency = arenaRank.rewardSoftCurrency;
                player.credit(gameDatabase.currencies.SOFT_CURRENCY, rewardSoftCurrency, "Arena Rankup [" + session + "]");
                var softCurrency = GetCurrency(playerId, gameDatabase.currencies.SOFT_CURRENCY);
                updateCurrencies.push(softCurrency);
                // Hard currency
                rewardHardCurrency = arenaRank.rewardHardCurrency;
                player.credit(gameDatabase.currencies.HARD_CURRENCY, rewardHardCurrency, "Arena Rankup [" + session + "]");
                var hardCurrency = GetCurrency(playerId, gameDatabase.currencies.HARD_CURRENCY);
                updateCurrencies.push(hardCurrency);
                // Items
                var countRewardItems = arenaRank.rewardItems.length;
                for (var i = 0; i < countRewardItems; ++i)
                {
                    var rewardItem = arenaRank.rewardItems[i];
                    if (!rewardItem || !rewardItem.id)
                    {
                        continue;
                    }
                        
                    var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                    if (addItemsResult.success)
                    {
                        var countCreateItems = addItemsResult.createItems.length;
                        var countUpdateItems = addItemsResult.updateItems.length;
                        for (var j = 0; j < countCreateItems; ++j)
                        {
                            var createItem = addItemsResult.createItems[j];
                            var newItemId = createItem.id;
                            var newItemEntry = API.createItem(colPlayerItem, newItemId);
                            newItemEntry.setData(createItem);
                            newItemEntry.persistor().persist().error();
                            HelperUnlockItem(playerId, createItem.dataId);
                            rewardItems.push(createItem);
                            createItems.push(createItem);
                        }
                        for (var j = 0; j < countUpdateItems; ++j)
                        {
                            var updateItem = addItemsResult.updateItems[j];
                            var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                            var updateItemEntry = updateItemResult.document();
                            updateItemEntry.setData(updateItem);
                            updateItemEntry.persistor().persist().error();
                            rewardItems.push(updateItem);
                            updateItems.push(updateItem);
                        }
                    }
                    // End add item condition
                }
                // End reward items loop
            }
            // Update achievement
            QueryUpdateAchievement(UpdateCountWinDuel(playerId, GetAchievementListInternal(playerId)));
        }
        else
        {
            updateScore = -gameDatabase.arenaLoseScoreDecrease;
            arenaScore -= gameDatabase.arenaLoseScoreDecrease;
            player.setScriptData("arenaScore", arenaScore);
        }
        // Set API result
        Spark.setScriptData("rewardItems", rewardItems);
        Spark.setScriptData("createItems", createItems);
        Spark.setScriptData("updateItems", updateItems);
        Spark.setScriptData("deleteItemIds", deleteItemIds);
        Spark.setScriptData("updateCurrencies", updateCurrencies);
        Spark.setScriptData("rewardSoftCurrency", rewardSoftCurrency);
        Spark.setScriptData("rewardHardCurrency", rewardHardCurrency);
        Spark.setScriptData("rating", rating);
        Spark.setScriptData("updateScore", updateScore);
        Spark.setScriptData("player", GetPlayer(playerId));
    }
}