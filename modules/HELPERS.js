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

var API = Spark.getGameDataService();
var colPlayerItem = "playerItem";
var colPlayerStamina = "playerStamina";
var colPlayerFormation = "playerFormation";
var colPlayerUnlockItem = "playerUnlockItem";
var colPlayerClearStage = "playerClearStage";
var colPlayerBattle = "playerBattle";
var colPlayer = "player";

function GenerateUUID()
{
    var d = new Date().getTime();
    var uuid = 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function ShuffleArray(array)
{
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

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

function CalculatePlayerLevel(exp)
{
    var maxLevel = gameDatabase.playerMaxLevel;
    var expTable = gameDatabase.playerExpTable;
    return CalculateLevel(exp, maxLevel, expTable.minValue, expTable.maxValue, expTable.growth);
}

function CalculateItemLevel(exp, itemTier)
{
    var maxLevel = itemTier.maxLevel;
    var expTable = itemTier.expTable;
    return CalculateLevel(exp, maxLevel, expTable.minValue, expTable.maxValue, expTable.growth);
}

function CalculateLevel(exp, maxLevel, minValue, maxValue, growth)
{
    var remainExp = exp;
    var level = 1;
    for (level = 1; level < maxLevel; ++level)
    {
        var nextExp = CalculateIntAttribute(level, maxLevel, minValue, maxValue, growth);
        if (remainExp - nextExp < 0)
            break;
        remainExp -= nextExp;
    }
    return level;
}

function CanItemBeMaterial(item)
{
    return (!item.equipItemId || item.equipItemId.length === 0);
}

function CanSellItem(item)
{
    return (!item.equipItemId || item.equipItemId.length === 0);
}

function CalculateItemLevelUpPrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixLevelUpPrice)
        return itemData.fixLevelUpPrice;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var levelUpPriceTable = itemTier.levelUpPriceTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, levelUpPriceTable.minValue, levelUpPriceTable.maxValue, levelUpPriceTable.growth);
}

function CalculateItemEvolvePrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    return itemTier.evolvePrice;
}

function CalculateItemRewardExp(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixRewardExp)
        return itemData.fixRewardExp;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var rewardExpTable = itemTier.rewardExpTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, rewardExpTable.minValue, rewardExpTable.maxValue, rewardExpTable.growth);
}

function CalculateItemSellPrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixSellPrice)
        return itemData.fixSellPrice;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var sellPriceTable = itemTier.sellPriceTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, sellPriceTable.minValue, sellPriceTable.maxValue, sellPriceTable.growth);
}

function GetItemEvolveMaterials(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return [];
        
    var evolveInfo = itemData.evolveInfo;
    if (!evolveInfo)
        return [];
        
    return evolveInfo.requiredMaterials;
}

function GetItemEvolve(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return item;
        
    var evolveInfo = itemData.evolveInfo;
    if (!evolveInfo)
        return item;
        
    item.dataId = evolveInfo.evolveItem;
    if (gameDatabase.resetItemLevelAfterEvolve)
        item.exp = 0;
    return item;
}

function GeneratePlayerBattleId()
{
    return GenerateUUID();
}

function CreatePlayerBattle(playerId, dataId, session)
{
    return {
        "id" : GeneratePlayerBattleId(),
        "playerId" : playerId,
        "dataId" : dataId,
        "session" : session,
        "battleResult" : ENUM_BATTLE_RESULT_NONE,
        "rating" : 0,
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerClearStageId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerClearStage(playerId, dataId)
{
    return {
        "id" : GeneratePlayerClearStageId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "bestRating" : 0,
        "timestamp" : new Date().getTime(),
    }
}

function GeneratePlayerFormationId(playerId, dataId, position)
{
    return (playerId + "-" + dataId + "-" + position).split('_').join('-');
}

function CreatePlayerFormation(playerId, dataId, position)
{
    return {
        "id" : GeneratePlayerFormationId(playerId, dataId, position),
        "playerId" : playerId,
        "dataId" : dataId,
        "position" : position,
        "itemId" : "",
        "timestamp" : new Date().getTime(),
    }
}

function GeneratePlayerItemId()
{
    return GenerateUUID();
}

function CreatePlayerItem(playerId, dataId)
{
    return {
        "id" : GeneratePlayerItemId(),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 1,
        "exp" : 0,
        "equipItemId" : "",
        "equipPosition" : "",
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerStaminaId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerStamina(playerId, dataId)
{
    return {
        "id" : GeneratePlayerStaminaId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
        "recoveredTime" : 0,
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerUnlockItemId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerUnlockItem(playerId, dataId)
{
    return {
        "id" : GeneratePlayerUnlockItemId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
        "timestamp" : new Date().getTime(),
    };
}
    
function SetNewPlayerData(playerId)
{
    var firstFormation = gameDatabase.formations[0];
    var player = Spark.loadPlayer(playerId);
    player.setScriptData("exp", 0);
    player.setScriptData("selectedFormation", firstFormation);
    
    // Clear Stage
    var clearStageCursor = API.queryItems(colPlayerClearStage, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (clearStageCursor.hasNext())
    {
        clearStageCursor.next().delete();
    }
    // Formation
    var formationCursor = API.queryItems(colPlayerFormation, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (formationCursor.hasNext())
    {
        formationCursor.next().delete();
    }
    // Item
    var itemCursor = API.queryItems(colPlayerItem, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (itemCursor.hasNext())
    {
        itemCursor.next().delete();
    }
    // Stamina
    var staminaCursor = API.queryItems(colPlayerStamina, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (staminaCursor.hasNext())
    {
        staminaCursor.next().delete();
    }
    // Unlock Item
    var unlockItemCursor = API.queryItems(colPlayerUnlockItem, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (unlockItemCursor.hasNext())
    {
        unlockItemCursor.next().delete();
    }
    
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
                var newItemEntry = API.createItem(colPlayerItem, createItem.id);
                newItemEntry.setData(createItem);
                newItemEntry.persistor().persist().error();
                HelperUnlockItem(playerId, createItem.dataId);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItems[j];
                var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                var updateItemEntry = updateItemResult.document();
                updateItemEntry.setData(updateItem);
                updateItemEntry.persistor().persist().error();
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
                var newItemEntry = API.createItem(colPlayerItem, createItem.id);
                newItemEntry.setData(createItem);
                newItemEntry.persistor().persist().error();
                HelperUnlockItem(playerId, createItem.dataId);
                HelperSetFormation(playerId, createItem.id, firstFormation, i);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItems[j];
                var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                var updateItemEntry = updateItemResult.document();
                updateItemEntry.setData(updateItem);
                updateItemEntry.persistor().persist().error();
            }
        }
    }
}

function DecreasePlayerStamina(playerId, staminaType, decreaseAmount)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
        return;
    
    var player = Spark.loadPlayer(playerId);
    var exp = player.getScriptData("exp");
    var stamina = GetStamina(playerId, staminaTable.id);
    var currentLevel = CalculatePlayerLevel(exp);
    var maxLevel = gameDatabase.playerMaxLevel;
    var maxAmountTable = staminaTable.maxAmountTable;
    var maxStamina = CalculateIntAttribute(currentLevel, maxLevel, maxAmountTable.minValue, maxAmountTable.maxValue, maxAmountTable.growth);
    if (stamina.amount >= decreaseAmount)
    {
        if (stamina.amount >= maxStamina && stamina.amount - decreaseAmount < maxStamina)
            stamina.recoveredTime = Date.now();
        stamina.amount -= decreaseAmount;
        var doc = API.getItem(colPlayerStamina, stamina.id).document();
        if (doc)
        {
            doc.setData(stamina);
            doc.persistor().persist().error();
        }
        UpdatePlayerStamina(playerId, staminaType);
        return true;
    }
    return false;
}

function UpdatePlayerStamina(playerId, staminaType)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
    {
        Spark.getLog().error("Stamina not found: " + staminaType);
        return;
    }
    
    var player = Spark.loadPlayer(playerId);
    var exp = player.getScriptData("exp");
    var stamina = GetStamina(playerId, staminaTable.id);
    var currentLevel = CalculatePlayerLevel(exp);
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
        if (recoveryAmount > 0)
        {
            stamina.amount += recoveryAmount;
            if (stamina.amount > maxStamina)
                stamina.amount = maxStamina;
            stamina.recoveredTime = currentTimeInMillisecond;
            var doc = API.getItem(colPlayerStamina, stamina.id).document();
            if (doc)
            {
                doc.setData(stamina);
                doc.persistor().persist().error();
            }
        }
    }
}

function UpdateAllPlayerStamina(playerId)
{
    UpdatePlayerStamina(playerId, "STAGE");
    UpdatePlayerStamina(playerId, "ARENA");
}

function GetCurrency(playerId, dataId)
{
    var player = Spark.loadPlayer(playerId);
    return { "id" : playerId + "_" + dataId, "playerId" : playerId, "dataId" : dataId, "amount" : player.getBalance(dataId) };
}

function GetStamina(playerId, dataId)
{
    var queryResult = API.queryItems(
        colPlayerStamina,
        API.S("playerId").eq(playerId).and(API.S("dataId").eq(dataId)),
        API.sort("id", false));
    var result = queryResult.cursor();
    var stamina;
    if (!result.hasNext())
    {
        stamina = CreatePlayerStamina(playerId, dataId);
        var id = stamina.id;
        var newEntry = API.createItem(colPlayerStamina, id);
        newEntry.setData(stamina);
        newEntry.persistor().persist().error();
    }
    else
    {
        stamina = result.next().getData();
    }
    return stamina;
}

function GetPlayer(playerId)
{
    var player = Spark.loadPlayer(playerId);
    return {
        "id" : playerId,
        "profileName" : player.getDisplayName(),
        "exp" : player.getScriptData("exp"),
        "selectedFormation" : player.getScriptData("selectedFormation"),
        "selectedArenaFormation" : player.getScriptData("selectedArenaFormation"),
        "arenaScore" : player.getScriptData("arenaScore"),
        "highestArenaRank" : player.getScriptData("highestArenaRank"),
        "highestArenaRankCurrentSeason" : player.getScriptData("highestArenaRankCurrentSeason")
    };
}

function AddItems(playerId, dataId, amount)
{
    var item = gameDatabase.items[dataId];
    if (!item)
        return { "success" : false };
        
    var maxStack = item.maxStack;
    var queryResult = API.queryItems(
        colPlayerItem,
        API.S("playerId").eq(playerId).and(API.S("dataId").eq(dataId)).and(API.N("amount").lt(maxStack)),
        API.sort("id", false));
    var oldEntries = queryResult.cursor();
    var createItems = [];
    var updateItems = [];
    while (oldEntries.hasNext())
    {
        var entry = oldEntries.next().getData();
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
    var newFormation;
    var oldFormation;
    var oldFormationEntry;
    if (characterId && characterId.length > 0)
    {
        var oldQueryResult = API.queryItems(colPlayerFormation,
            API.S("playerId").eq(playerId));
        var oldResult = oldQueryResult.cursor();
        while (oldResult.hasNext())
        {
            var entry = oldResult.next();
            var entryData = entry.getData();
            if (entryData.itemId == characterId && entryData.dataId == formationName)
            {
                oldFormationEntry = entry;
                oldFormation = entryData;
                oldFormation.itemId = "";
                oldFormationEntry.setData(oldFormation);
                oldFormationEntry.persistor().persist().error();
            }
        }
    }
    var formation;
    var formationDoc = API.getItem(colPlayerFormation, GeneratePlayerFormationId(playerId, formationName, position)).document();
    if (formationDoc)
    {
        formation = formationDoc.getData();
    }
    if (!formation)
    {
        formation = CreatePlayerFormation(playerId, formationName, position);
        formation.itemId = characterId;
        var newEntry = API.createItem(colPlayerFormation, formation.id);
        newEntry.setData(formation);
        newEntry.persistor().persist().error();
        newFormation = formation;
    }
    else
    {
        if (oldFormation)
        {
            oldFormation.itemId = formation.itemId;
            oldFormationEntry.setData(oldFormation);
            oldFormationEntry.persistor().persist().error();
        }
        formation.itemId = characterId;
        formationDoc.setData(formation);
        formationDoc.persistor().persist().error();
    }
    if (!oldFormation)
    {
        oldFormation = {};
    }
    if (!newFormation)
    {
        newFormation = {};
    }
    return { oldFormation: oldFormation, newFormation: newFormation };
}

function HelperUnlockItem(playerId, dataId)
{
    var unlockItem;
    var unlockItemDoc = API.getItem(colPlayerUnlockItem, GeneratePlayerUnlockItemId(playerId, dataId)).document();
    if (unlockItemDoc)
    {
        unlockItem = unlockItemDoc.getData();
    }
    if (!unlockItem)
    {
        unlockItem = CreatePlayerUnlockItem(playerId, dataId);
        var newEntry = API.createItem(colPlayerUnlockItem, unlockItem.id);
        newEntry.setData(unlockItem);
        newEntry.persistor().persist().error();
    }
    return unlockItem;
}

function HelperClearStage(playerId, dataId, rating)
{
    var clearStage;
    var clearStageDoc = API.getItem(colPlayerClearStage, GeneratePlayerClearStageId(playerId, dataId)).document();
    if (clearStageDoc)
    {
        clearStage = clearStageDoc.getData();
    }
    if (!clearStage)
    {
        clearStage = CreatePlayerClearStage(playerId, dataId);
        clearStage.bestRating = rating;
        var newEntry = API.createItem(colPlayerClearStage, clearStage.id);
        newEntry.setData(clearStage);
        newEntry.persistor().persist().error();
    }
    else
    {
        // If end stage with more rating, replace old rating
        if (clearStage.bestRating < rating)
        {
            clearStage.bestRating = rating;
            clearStageDoc.setData(clearStage);
            clearStageDoc.persistor().persist().error();
        }
    }
    return clearStage;
}

function GetFormationCharacterIds(playerId, playerSelectedFormation)
{
    var characterIds = [];
    var formationsQueryResult = API.queryItems(
        colPlayerFormation, 
        API.S("playerId").eq(playerId));
    var formationsResult = formationsQueryResult.cursor();
    while (formationsResult.hasNext())
    {
        var formationEntry = formationsResult.next();
        var formation = formationEntry.getData();
        if (formation.dataId == playerSelectedFormation && formation.itemId)
        {
            characterIds.push(formation.itemId);
        }
    }
    return characterIds;
}

function GetFormationCharacter(playerId, playerSelectedFormation)
{
    var characters = [];
    var characterIds = GetFormationCharacterIds(playerId, playerSelectedFormation);
    for (var i = 0; i < characterIds.length; ++i)
    {
        var characterId = characterIds[i];
        var characterQueryResult = API.getItem(colPlayerItem, characterId);
        var characterData = characterQueryResult.document().getData();
        if (characterData)
        {
            characters.push(characterData);
        }
    }
    return characters;
}

function GetLeaderCharacter(playerId, playerSelectedFormation)
{
    var characterData = undefined;
    var formationsQueryResult = API.queryItems(
        colPlayerFormation, 
        API.S("playerId").eq(playerId));
    var formationsResult = formationsQueryResult.cursor();
    while (formationsResult.hasNext())
    {
        var formationEntry = formationsResult.next();
        var formation = formationEntry.getData();
        if (formation.dataId == playerSelectedFormation && formation.itemId)
        {
            var characterQueryResult = API.getItem(colPlayerItem, formation.itemId);
            var currentCharacterData = characterQueryResult.document().getData();
            if (currentCharacterData)
            {
                if (!characterData)
                {
                    // Set first found character, will return it when leader not found
                    characterData = currentCharacterData;
                }
                if (formation.isLeader)
                {
                    return characterData;
                }
            }
        }
    }
    return characterData;
}

function CalculateArenaRankLevel(arenaScore)
{
    var level = 0;
    var count = gameDatabase.arenaRanks.length;
    for (var i = 0; i < count; ++i)
    {
        var arenaRank = gameDatabase.arenaRanks[i];
        if (arenaScore < arenaRank.scoreToRankUp)
            break;
        level++;
    }
    return level;
}

function GetArenaRank(arenaScore)
{
    
    var level = CalculateArenaRankLevel(arenaScore);
    if (level >= gameDatabase.arenaRanks.length)
        level = gameDatabase.arenaRanks.length - 1;
    return level >= 0 ? gameDatabase.arenaRanks[level] : undefined;
}

function GetSocialPlayer(playerId, targetPlayerId)
{
    var player = Spark.loadPlayer(targetPlayerId);
    if (player)
    {
        var queryResult = API.queryItems(colPlayerFriend, API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)), API.sort("timestamp", false));
        var result = queryResult.cursor();
        var isFriend = result.hasNext();
        var displayName = player.getDisplayName();
        var playerSelectedFormation = player.getScriptData("selectedFormation");
        var character = GetLeaderCharacter(targetPlayerId, playerSelectedFormation);
        if (displayName && character)
        {
            return {
                "id" : targetPlayerId,
                "profileName" : displayName,
                "exp" : player.getScriptData("exp"),
                "mainCharacter" : character.dataId,
                "mainCharacterExp" : character.exp,
                "isFriend" : isFriend
            };
        }
    }
    return undefined;
}

function GetPlayerIds()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var playerIds = [];
    var queryResult = API.queryItems(colPlayer, API.S("playerId").ne(playerId));
    var result = queryResult.cursor();
    while (result.hasNext())
    {
        var entry = result.next();
        var data = entry.getData();
        playerIds.push(data.playerId);
    }
    return playerIds;
}