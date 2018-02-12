// ====================================================================================================
//
// Cloud Code for HELPERS, write your code here to customize the GameSparks platform.
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

function RandomRange(min, max)
{
    return Math.random() * (max - min) + min;
}

function WeightedRandom(weights, noResultWeight)
{
    // Usage example: WeightedRandom({"a":0.5,"b":0.3,"c":0.2}); //Have chance to receives a = 50%, b = 30%, c = 20%
    
    if (!noResultWeight)
        noResultWeight = 0;
        
    var keys = [];
    var sum = 0;
    for (var key in weights)
    {
        var weight = weights[key];
        sum += weight;
        keys.push(key);
    }
    
    if (keys.length === 0)
        return undefined;
    
    var roll = RandomRange(0, sum + noResultWeight)
    var selected = keys[keys.length - 1];
    for (var key in weights)
    {
        var weight = weights[key];
        if (roll < weight)
        {
            selected = key;
            break;
        }
        roll -= weight;
    }
    
    return selected;
}

function RandomLootBoxReward(lootBox)
{
    var lootboxRewards = lootBox.lootboxRewards;
    var generatedResult = {};
    var generatedWeight = {};
    var countLootboxRewards = lootboxRewards.length;
    for (var i = 0; i < countLootboxRewards; ++i)
    {
        var lootboxReward = lootboxRewards[i];
        var id = "_" + i;
        generatedResult[id] = lootboxReward;
        generatedWeight[id] = lootboxReward.randomWeight;
    }
    
    var takenId = WeightedRandom(generatedWeight, 0);
    if (takenId)
    {
        return generatedResult[takenId];
    }
    return undefined;
}

function CalculateIntAttribute(currentLevel, maxLevel, minValue, maxValue, growth)
{
    if (currentLevel <= 0)
        currentLevel = 1;
    if (maxLevel <= 0)
        maxLevel = 1;
    if (currentLevel == 1)
        return minValue;
    if (currentLevel == maxLevel)
        return maxValue;
    return minValue + Math.round((maxValue - minValue) * Math.pow((currentLevel - 1) / (maxLevel - 1), growth));
}

function CalculateFloatAttribute(currentLevel, maxLevel, minValue, maxValue, growth)
{
    if (currentLevel <= 0)
        currentLevel = 1;
    if (maxLevel <= 0)
        maxLevel = 1;
    if (currentLevel == 1)
        return minValue;
    if (currentLevel == maxLevel)
        return maxValue;
    return minValue + ((maxValue - minValue) * Math.pow((currentLevel - 1) / (maxLevel - 1), growth));
}

function CalculateLevel(exp)
{
    var remainExp = exp;
    var maxLevel = gameDatabase.playerMaxLevel;
    var playerExpTable = gameDatabase.playerExpTable;
    var level = 1;
    for (level = 1; level < maxLevel; ++level)
    {
        var nextExp = CalculateIntAttribute(level, maxLevel, playerExpTable.minValue, playerExpTable.maxValue, playerExpTable.growth);
        if (remainExp - nextExp < 0)
            break;
        remainExp -= nextExp;
    }
    return level;
}

function CreatePlayerBattle(playerId, dataId, session)
{
    return {
        "playerId" : playerId,
        "dataId" : dataId,
        "session" : session,
        "battleResult" : ENUM_BATTLE_RESULT_NONE,
        "rating" : 0,
    };
}

function CreatePlayerClearStage(playerId, dataId)
{
    return {
        "_id" : playerId + "_" + dataId,
        "playerId" : playerId,
        "dataId" : dataId,
        "bestRating" : 0,
    }
}

function CreatePlayerFormation(playerId, dataId, position)
{
    return {
        "_id" : playerId + "_" + dataId + "_" + position,
        "playerId" : playerId,
        "dataId" : dataId,
        "position" : position,
        "itemId" : "",
    }
}

function CreatePlayerItem(playerId, dataId)
{
    return {
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 1,
        "exp" : 0,
        "equipItemId" : "",
        "equipPosition" : ""
    };
}

function CreatePlayerStamina(playerId, dataId)
{
    return {
        "_id" : playerId + "_" + dataId,
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
        "recoveredTime" : 0,
    };
}

function CreatePlayerUnlockItem(playerId, dataId)
{
    return {
        "_id" : playerId + "_" + dataId,
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
    };
}
    
function SetNewPlayerData(playerId)
{
    var firstFormation = gameDatabase.formations[0];
    var player = Spark.loadPlayer(playerId);
    player.setScriptData("exp", 0);
    player.setScriptData("selectedFormation", firstFormation);
    
    colPlayerClearStage.remove({ "playerId" : playerId });
    colPlayerFormation.remove({ "playerId" : playerId });
    colPlayerItem.remove({ "playerId" : playerId });
    colPlayerStamina.remove({ "playerId" : playerId });
    colPlayerUnlockItem.remove({ "playerId" : playerId });
    
    var startItems = gameDatabase.startItems;
    var countStartItems = startItems.length;
    for (var i = 0; i < countStartItems; ++i)
    {
        var startItem = startItems[i];
        var addItemsResult = AddItems(playerId, startItem.id, startItem.amount);
        if (addItemsResult.success)
        {
            var createItems = addItemsResult.createItems;
            var updateItems = addItemsResult.updateItems;
            var countCreateItems = createItems.length;
            var countUpdateItems = updateItems.length;
            for (var j = 0; j < countCreateItems; ++j)
            {
                var createItem = createItems[j];
                colPlayerItem.insert(createItem);
                HelperUnlockItem(playerId, startItem.id);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItem[j];
                colPlayerItem.update({ "_id" : updateItem._id }, updateItem);
            }
        }
    }
    
    var startCharacters = gameDatabase.startCharacters;
    var countStartCharacters = startCharacters.length;
    for (var i = 0; i < countStartCharacters; ++i)
    {
        var startCharacter = startCharacters[i];
        var addItemsResult = AddItems(playerId, startCharacter, 1);
        if (addItemsResult.success)
        {
            var createItems = addItemsResult.createItems;
            var updateItems = addItemsResult.updateItems;
            var countCreateItems = createItems.length;
            var countUpdateItems = updateItems.length;
            for (var j = 0; j < countCreateItems; ++j)
            {
                var createItem = createItems[j];
                colPlayerItem.insert(createItem);
                HelperUnlockItem(playerId, startItem.id);
                HelperSetFormation(playerId, createItem._id.$oid, firstFormation, i);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItem[j];
                colPlayerItem.update({ "_id" : updateItem._id }, updateItem);
            }
        }
    }
}

function DecreasePlayerStamina(playerId, staminaType, decreaseAmount)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
        return;
    
    var stamina = GetStamina(playerId, staminaTable.id);
    if (stamina.amount >= decreaseAmount)
    {
        stamina.amount -= decreaseAmount;
        colPlayerStamina.update({ "_id" : stamina._id }, stamina);
        UpdatePlayerStamina(playerId, staminaType);
        return true;
    }
    return false;
}

function UpdatePlayerStamina(playerId, staminaType)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
        return;
    
    var player = Spark.loadPlayer(playerId);
    var exp = player.getScriptData("exp");
    var stamina = GetStamina(playerId, staminaTable.id);
    var currentLevel = CalculateLevel(exp);
    var maxLevel = gameDatabase.playerMaxLevel;
    var maxAmountTable = staminaTable.maxAmountTable;
    var maxStamina = CalculateIntAttribute(currentLevel, maxLevel, maxAmountTable.minValue, maxAmountTable.maxValue, maxAmountTable.growth);
    if (stamina.amount < maxStamina)
    {
        var currentTimeInMillisecond = Date.now();
        var diffTimeInMillisecond = currentTimeInMillisecond - stamina.recoveredTime;
        var devideAmount = 1;
        switch (staminaTable.recoverUnit)
        {
            case ENUM_STAMINA_UNIT_DAYS:
                devideAmount = 1000 * 60 * 60 * 24;
                break;
            case ENUM_STAMINA_UNIT_HOURS:
                devideAmount = 1000 * 60 * 60;
                break;
            case ENUM_STAMINA_UNIT_MINUTES:
                devideAmount = 1000 * 60;
                break;
            case ENUM_STAMINA_UNIT_SECONDS:
                devideAmount = 1000;
                break;
        }
        var recoveryAmount = Math.floor((diffTimeInMillisecond / devideAmount) / staminaTable.recoverDuration);
        stamina.amount += recoveryAmount;
        if (stamina.amount > maxStamina)
            stamina.amount = maxStamina;
        stamina.recoveredTime = currentTimeInMillisecond;
        colPlayerStamina.update({ "_id" : stamina._id }, stamina);
    }
}

function UpdateAllPlayerStamina(playerId)
{
    UpdatePlayerStamina(playerId, "STAGE");
}

function GetCurrency(playerId, dataId)
{
    var player = Spark.loadPlayer(playerId);
    return { "id" : playerId + "_" + dataId, "playerId" : playerId, "dataId" : dataId, "amount" : player.getBalance(dataId) };
}

function GetStamina(playerId, dataId)
{
    var stamina = colPlayerStamina.findOne({ "playerId" : playerId, "dataId" : dataId });
    if (stamina == null)
    {
        stamina = CreatePlayerStamina(playerId, dataId);
        colPlayerStamina.insert(stamina);
    }
    return stamina;
}

function GetPlayer(playerId)
{
    var player = Spark.loadPlayer(playerId);
    return { "id" : playerId, "profileName" : player.getDisplayName(), "exp" : player.getScriptData("exp"), "selectedFormation" : player.getScriptData("selectedFormation") };
}

function AddItems(playerId, dataId, amount)
{
    var item = gameDatabase.items[dataId];
    if (!item)
        return { "success" : false };
        
    var maxStack = item.maxStack;
    var oldEntries = colPlayerItem.find({ "playerId" : playerId, "dataId" : dataId, "amount" : { "$lt": maxStack }});
    var createItems = [];
    var updateItems = [];
    while (oldEntries.hasNext())
    {
        var entry = oldEntries.next();
        var sumAmount = entry.amount + amount;
        if (sumAmount > maxStack)
        {
            entry.amount = maxStack;
            amount = sumAmount - maxStack;
        }
        else
        {
            entry.amount += amount;
            amount = 0;
        }
        updateItems.push(entry);

        if (amount == 0)
            break;
    }
    while (amount > 0)
    {
        var newEntry = CreatePlayerItem(playerId, dataId);
        if (amount > maxStack)
        {
            newEntry.amount = maxStack;
            amount -= maxStack;
        }
        else
        {
            newEntry.amount = amount;
            amount = 0;
        }
        createItems.push(newEntry);
    }
    return { "success" : true, "createItems" : createItems, "updateItems" : updateItems }
}

function HelperSetFormation(playerId, characterId, formationName, position)
{
    if (characterId && characterId.length > 0)
    {
        var oldFormation = colPlayerFormation.findOne({ "playerId" : playerId, "dataId" : formationName, "itemId" : characterId });
        if (oldFormation)
        {
            oldFormation.itemId = "";
            colPlayerFormation.update({ "_id" : oldFormation._id }, oldFormation);
        }
    }
    var formation = colPlayerFormation.findOne({ "playerId" : playerId, "dataId" : formationName, "position" : position });
    if (!formation)
    {
        formation = CreatePlayerFormation(playerId, formationName, position);
        formation.itemId = characterId;
        colPlayerFormation.insert(formation);
    }
    else
    {
        if (oldFormation)
        {
            oldFormation.itemId = formation.itemId;
            colPlayerFormation.update({ "_id" : oldFormation._id }, oldFormation);
        }
        formation.itemId = characterId;
        colPlayerFormation.update({ "_id" : formation._id }, formation);
    }
}

function HelperUnlockItem(playerId, dataId)
{
    var unlockItem = colPlayerUnlockItem.findOne({ "playerId" : playerId, "dataId" : dataId });
    if (!unlockItem)
    {
        unlockItem = CreatePlayerUnlockItem(playerId, dataId);
        colPlayerUnlockItem.insert(unlockItem);
    }
}

function HelperClearStage(playerId, dataId, grade)
{
    var clearStage = colPlayerClearStage.findOne({ "playerId" : playerId, "dataId" : dataId });
    if (clearStage == null)
    {
        clearStage = CreatePlayerClearStage(playerId, dataId);
        clearStage.bestRating = grade;
        colPlayerClearStage.insert(clearStage);
    }
    else
    {
        if (clearStage.bestRating < grade)
        {
            clearStage.bestRating = grade;
            colPlayerClearStage.update({ "_id" : clearStage._id }, clearStage);
        }
    }
}
