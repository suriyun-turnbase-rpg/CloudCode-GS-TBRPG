// ====================================================================================================
//
// Cloud Code for SERVICE_BATTLE, write your code here to customize the GameSparks platform.
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
var colPlayerFormation = "playerFormation";
var colPlayerUnlockItem = "playerUnlockItem";
var colPlayerClearStage = "playerClearStage";
var colPlayerBattle = "playerBattle";

function StartStage(stageDataId, helperPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerBattle, 
        API.S("playerId").eq(playerId).and(API.N("battleResult").eq(ENUM_BATTLE_RESULT_NONE)).and(API.N("battleType").eq(ENUM_BATTLE_TYPE_STAGE)),
        API.sort("id", false));
    var battleCursor = queryResult.cursor();
    while (battleCursor && battleCursor.hasNext())
    {
        battleCursor.next().delete();
    }
    var stage = gameDatabase.stages[stageDataId];
    if (!stage)
    {
        Spark.setScriptData("error", ERROR_INVALID_STAGE_DATA);
    }
    else if (!DecreasePlayerStamina(playerId, "STAGE", stage.requireStamina))
    {
        Spark.setScriptData("error", ERROR_NOT_ENOUGH_STAGE_STAMINA);
    }
    else
    {
        var session = playerId + "_" + stageDataId + "_" + Date.now();
        var newData = CreatePlayerBattle(playerId, stageDataId, session);
        var id = newData.id;
        var newEntry = API.createItem(colPlayerBattle, id);
        newEntry.setData(newData);
        newEntry.persistor().persist().error();
        var staminaTable = gameDatabase.staminas["STAGE"];
        var stamina = GetStamina(playerId, staminaTable.id);
        if (helperPlayerId && helperPlayerId.length > 0)
        {
            // Update achievement
            QueryUpdateAchievement(UpdateCountUseHelper(playerId, GetAchievementListInternal(playerId)));
        }
        // Set API result
        Spark.setScriptData("stamina", stamina);
        Spark.setScriptData("session", session);
    }
}

function FinishStage(session, battleResult, deadCharacters)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerBattle, 
        API.S("playerId").eq(playerId).and(API.S("session").eq(session)),
        API.sort("id", false));
    var battleCursor = queryResult.cursor();
    if (!battleCursor || !battleCursor.hasNext())
    {
        Spark.setScriptData("error", ERROR_INVALID_BATTLE_SESSION);
    }
    else
    {
        var battleEntry = battleCursor.next();
        var battle = battleEntry.getData();
        if (!gameDatabase.stages[battle.dataId])
        {
            Spark.setScriptData("error", ERROR_INVALID_STAGE_DATA);
        }
        else
        {
            // Prepare results
            var apiResult = {
                rewardItems: [],
                createItems: [],
                updateItems: [],
                deleteItemIds: [],
                updateCurrencies: [],
                rewardPlayerExp: 0,
                rewardCharacterExp: 0,
                rewardSoftCurrency: 0,
                rating: 0,
                clearStage: {},
                isFirstClear: false,
                firstClearRewardPlayerExp: 0,
                firstClearRewardSoftCurrency: 0,
                firstClearRewardHardCurrency: 0,
                firstClearRewardItems: []
            };
            var rewardItems = apiResult.rewardItems;
            var createItems = apiResult.createItems;
            var updateItems = apiResult.updateItems
            var deleteItemIds = apiResult.deleteItemIds;
            var updateCurrencies = apiResult.updateCurrencies;
            var rewardPlayerExp = apiResult.rewardPlayerExp;
            var rewardCharacterExp = apiResult.rewardCharacterExp;
            var rewardSoftCurrency = apiResult.rewardSoftCurrency;
            var rating = apiResult.rating;
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
                var playerSelectedFormation = player.getScriptData("selectedFormation");
                var stage = gameDatabase.stages[battle.dataId];
                rewardPlayerExp = stage.rewardPlayerExp;
                // Player exp
                var playerExp = player.getScriptData("exp");
                playerExp += rewardPlayerExp;
                player.setScriptData("exp", playerExp);
                // Character exp
                var characterIds = GetFormationCharacterIds(playerId, playerSelectedFormation);
                if (characterIds.length > 0)
                {
                    var devivedExp = Math.floor(stage.rewardCharacterExp / characterIds.length);
                    rewardCharacterExp = devivedExp;
                    var countCharacterIds = characterIds.length;
                    for (var i = 0; i < countCharacterIds; ++i)
                    {
                        var characterId = characterIds[i];
                        var characterQueryResult = API.getItem(colPlayerItem, characterId);
                        var characterEntry = characterQueryResult.document();
                        if (characterEntry)
                        {
                            var character = characterEntry.getData();
                            character.exp += devivedExp;
                            characterEntry.setData(character);
                            characterEntry.persistor().persist().error();
                            updateItems.push(character);
                        }
                    }
                }
                // Soft currency
                rewardSoftCurrency = RandomRange(stage.randomSoftCurrencyMinAmount, stage.randomSoftCurrencyMaxAmount);
                player.credit(gameDatabase.currencies.SOFT_CURRENCY, rewardSoftCurrency, "Pass Stage [" + session + "]");
                var softCurrency = GetCurrency(playerId, gameDatabase.currencies.SOFT_CURRENCY);
                updateCurrencies.push(softCurrency);
                // Items
                var countRewardItems = stage.rewardItems.length;
                for (var i = 0; i < countRewardItems; ++i)
                {
                    var rewardItem = stage.rewardItems[i];
                    if (!rewardItem || !rewardItem.id || RandomRange(0, 1) > rewardItem.randomRate)
                    {
                        continue;
                    }
                        
                    var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                    if (addItemsResult.success)
                    {
                        rewardItems.push(CreateEmptyItem(i, playerId, rewardItem.id, rewardItem.amount));

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
                            createItems.push(createItem);
                        }
                        for (var j = 0; j < countUpdateItems; ++j)
                        {
                            var updateItem = addItemsResult.updateItems[j];
                            var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                            var updateItemEntry = updateItemResult.document();
                            updateItemEntry.setData(updateItem);
                            updateItemEntry.persistor().persist().error();
                            updateItems.push(updateItem);
                        }
                    }
                    // End add item condition
                }
                // End reward items loop
                
                apiResult.rewardItems = rewardItems;
                apiResult.createItems = createItems;
                apiResult.updateItems = updateItems;
                apiResult.deleteItemIds = deleteItemIds;
                apiResult.updateCurrencies = updateCurrencies;
                apiResult.rewardPlayerExp = rewardPlayerExp;
                apiResult.rewardCharacterExp = rewardCharacterExp;
                apiResult.rewardSoftCurrency = rewardSoftCurrency;
                apiResult.rating = rating;
                apiResult = HelperClearStage(apiResult, player, playerId, stage, rating);
            }
            // Set API result
            Spark.setScriptData("rewardItems", apiResult.rewardItems);
            Spark.setScriptData("createItems", apiResult.createItems);
            Spark.setScriptData("updateItems", apiResult.updateItems);
            Spark.setScriptData("deleteItemIds", apiResult.deleteItemIds);
            Spark.setScriptData("updateCurrencies", apiResult.updateCurrencies);
            Spark.setScriptData("rewardPlayerExp", apiResult.rewardPlayerExp);
            Spark.setScriptData("rewardCharacterExp", apiResult.rewardCharacterExp);
            Spark.setScriptData("rewardSoftCurrency", apiResult.rewardSoftCurrency);
            Spark.setScriptData("rating", apiResult.rating);
            Spark.setScriptData("clearStage", apiResult.clearStage);
            Spark.setScriptData("isFirstClear", apiResult.isFirstClear);
            Spark.setScriptData("firstClearRewardPlayerExp", apiResult.firstClearRewardPlayerExp);
            Spark.setScriptData("firstClearRewardSoftCurrency", apiResult.firstClearRewardSoftCurrency);
            Spark.setScriptData("firstClearRewardHardCurrency", apiResult.firstClearRewardHardCurrency);
            Spark.setScriptData("firstClearRewardItems", apiResult.firstClearRewardItems);
            Spark.setScriptData("player", GetPlayer(playerId));
        }
    }
}

function ReviveCharacters()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
    var revivePrice = gameDatabase.revivePrice;
    if (revivePrice > player.getBalance(hardCurrencyId))
    {
        Spark.setScriptData("error", ERROR_NOT_ENOUGH_HARD_CURRENCY);
    }
    else
    {
        player.debit(hardCurrencyId, revivePrice, "Revive Characters");
        var hardCurrency = GetCurrency(playerId, hardCurrencyId);
        var updateCurrencies = [];
        updateCurrencies.push(hardCurrency);
        // Update achievement
        QueryUpdateAchievement(UpdateCountRevive(playerId, GetAchievementListInternal(playerId)));
        // Set API result
        Spark.setScriptData("updateCurrencies", updateCurrencies);
    }
}

function SelectFormation(formationName, formationType)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var indexOfFormation = gameDatabase.formations.indexOf(formationName);
    if (indexOfFormation === -1)
    {
        Spark.setScriptData("error", ERROR_INVALID_FORMATION_DATA);
    }
    else
    {
        if (formationType === ENUM_FORMATION_TYPE_STAGE)
        {
            player.setScriptData("selectedFormation", formationName);
        }
        else if (formationType === ENUM_FORMATION_TYPE_ARENA)
        {
            player.setScriptData("selectedArenaFormation", formationName);
        }
        Spark.setScriptData("player", GetPlayer(playerId));
    }
}

function SetFormation(characterId, formationName, position)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    
    var formations = HelperSetFormation(playerId, characterId, formationName, position);
    
    var list = [];
    var queryResult = API.queryItems(colPlayerFormation, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var formationCursor = queryResult.cursor();
        while (formationCursor && formationCursor.hasNext())
        {
            var entry = formationCursor.next();
            list.push(entry.getData());
        }
    }
    if (formations.newFormation)
    {
        list.push(formations.newFormation);
    }
    Spark.setScriptData("list", list);
}
