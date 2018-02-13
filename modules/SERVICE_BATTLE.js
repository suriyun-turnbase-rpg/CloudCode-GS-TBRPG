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

var colPlayerItem = Spark.runtimeCollection("playerItem");
var colPlayerStamina = Spark.runtimeCollection("playerStamina");
var colPlayerFormation = Spark.runtimeCollection("playerFormation");
var colPlayerUnlockItem = Spark.runtimeCollection("playerUnlockItem");
var colPlayerClearStage = Spark.runtimeCollection("playerClearStage");
var colPlayerBattle = Spark.runtimeCollection("playerBattle");

function StartStage(stageDataId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    colPlayerBattle.remove({ "playerId" : playerId, "battleResult" : ENUM_BATTLE_RESULT_NONE });
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
        var playerBattle = CreatePlayerBattle(playerId, stageDataId, session);
        colPlayerBattle.insert(playerBattle);
        playerBattle.id = playerBattle._id.$oid;
        colPlayerBattle.update({ "_id" : playerBattle._id }, playerBattle);
        
        var staminaTable = gameDatabase.staminas["STAGE"];
        var stamina = GetStamina(playerId, staminaTable.id);
        
        Spark.setScriptData("stamina", stamina);
        Spark.setScriptData("session", session);
    }
}

function FinishStage(session, battleResult, deadCharacters)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var battle = colPlayerBattle.findOne({ "playerId" : playerId, "session" : session });
    if (!battle)
    {
        Spark.setScriptData("error", ERROR_INVALID_BATTLE_SESSION);
    }
    else if (!gameDatabase.stages[battle.dataId])
    {
        Spark.setScriptData("error", ERROR_INVALID_STAGE_DATA);
    }
    else
    {
        // Prepare results
        var rewardItems = [];
        var createItems = [];
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var rewardPlayerExp = 0;
        var rewardCharacterExp = 0;
        var rewardSoftCurrency = 0;
        var rating = 0;
        var clearedStage = {};
        // Set battle session
        battle.battleResult = battleResult;
        if (battleResult == ENUM_BATTLE_RESULT_WIN)
        {
            rating = 3 - deadCharacters;
            if (rating <= 0)
                rating = 1;
        }
        battle.rating = rating;
        colPlayerBattle.update({ "id" : battle.id }, battle);
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
            var characterIds = [];
            var formations = colPlayerFormation.find({ "playerId" : playerId, "dataId" : playerSelectedFormation });
            var countFormation = 0;
            while (formations.hasNext())
            {
                var formation = formations.next();
                if (formation.itemId) {
                    characterIds.push(formation.itemId);
                    ++countFormation;
                }
            }
            if (countFormation > 0)
            {
                var devivedExp = Math.floor(stage.rewardCharacterExp / countFormation);
                rewardCharacterExp = devivedExp;
                var countCharacterIds = characterIds.length;
                for (var i = 0; i < countCharacterIds; ++i)
                {
                    var characterId = characterIds[i];
                    var character = colPlayerItem.findOne({ "id" : characterId });
                    if (character)
                    {
                        character.exp += devivedExp;
                        colPlayerItem.update({ "id" : character.id }, character);
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
                    var countCreateItems = addItemsResult.createItems.length;
                    var countUpdateItems = addItemsResult.updateItems.length;
                    for (var j = 0; j < countCreateItems; ++j)
                    {
                        var createItem = addItemsResult.createItems[j];
                        colPlayerItem.insert(createItem);
                        createItem.id = createItem._id.$oid;
                        colPlayerItem.update({ "_id" : createItem._id }, createItem);
                        HelperUnlockItem(playerId, createItem.dataId);
                        rewardItems.push(createItem);
                        createItems.push(createItem);
                    }
                    for (var j = 0; j < countUpdateItems; ++j)
                    {
                        var updateItem = addItemsResult.updateItem[j];
                        colPlayerItem.update({ "id" : updateItem.id }, updateItem);
                        rewardItems.push(updateItem);
                        updateItems.push(updateItem);
                    }
                }
                // End add item condition
            }
            // End reward items loop
            clearedStage = colPlayerClearStage.findOne({ "playerId" : playerId, "dataId" : stage.id });
            if (!clearedStage)
            {
                clearedStage = CreatePlayerClearStage(playerId, stage.id);
                clearedStage.bestRating = rating;
                colPlayerClearStage.insert(clearedStage);
            }
            else
            {
                if (clearedStage.bestRating < rating)
                {
                    clearedStage.bestRating = rating;
                    colPlayerClearStage.update({ "id" : clearedStage.id }, clearedStage);
                }
            }
        }
        Spark.setScriptData("rewardItems", rewardItems);
        Spark.setScriptData("createItems", createItems);
        Spark.setScriptData("updateItems", updateItems);
        Spark.setScriptData("deleteItemIds", deleteItemIds);
        Spark.setScriptData("updateCurrencies", updateCurrencies);
        Spark.setScriptData("rewardPlayerExp", rewardPlayerExp);
        Spark.setScriptData("rewardCharacterExp", rewardCharacterExp);
        Spark.setScriptData("rewardSoftCurrency", rewardSoftCurrency);
        Spark.setScriptData("rating", rating);
        Spark.setScriptData("clearStage", clearedStage);
        Spark.setScriptData("player", GetPlayer(playerId));
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
        Spark.setScriptData("updateCurrencies", updateCurrencies);
    }
}

function SelectFormation(formationName)
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
        player.setScriptData("selectedFormation", formationName);
        Spark.setScriptData("player", GetPlayer(playerId));
    }
}

function SetFormation(characterId, formationName, position)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    
    HelperSetFormation(playerId, characterId, formationName, position);
    GetFormationList();
}
