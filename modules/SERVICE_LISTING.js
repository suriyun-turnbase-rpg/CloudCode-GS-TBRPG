// ====================================================================================================
//
// Cloud Code for SERVICE_LISTING, write your code here to customize the GameSparks platform.
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
var colPlayerFriend = "playerFriend";
var colPlayerFriendRequest = "playerFriendRequest";

function GetItemList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerItem, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var result = queryResult.cursor();
        while (result.hasNext())
        {
            var entry = result.next();
            list.push(entry.getData());
        }
    }
    Spark.setScriptData("list", list);
}

function GetCurrencyList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
    var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
    var list = [];
    list.push(GetCurrency(playerId, softCurrencyId));
    list.push(GetCurrency(playerId, hardCurrencyId));
    Spark.setScriptData("list", list);
}

function GetStaminaList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerStamina, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var result = queryResult.cursor();
        while (result.hasNext())
        {
            var entry = result.next();
            list.push(entry.getData());
        }
    }
    Spark.setScriptData("list", list);
}

function GetFormationList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerFormation, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var result = queryResult.cursor();
        while (result.hasNext())
        {
            var entry = result.next();
            list.push(entry.getData());
        }
    }
    Spark.setScriptData("list", list);
}

function GetUnlockItemList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerUnlockItem, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var result = queryResult.cursor();
        while (result.hasNext())
        {
            var entry = result.next();
            list.push(entry.getData());
        }
    }
    Spark.setScriptData("list", list);
}

function GetClearStageList()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerClearStage, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    if (!queryResult.error())
    {
        var result = queryResult.cursor();
        while (result.hasNext())
        {
            var entry = result.next();
            list.push(entry.getData());
        }
    }
    Spark.setScriptData("list", list);
}

function GetHelperList()
{
    var maximum = 25;
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var playerIds = ShuffleArray(GetPlayerIds());
    var list = [];
    for (var i = 0; i < playerIds.length; ++i)
    {
        var targetPlayerId = playerIds[i];
        if (playerId === targetPlayerId)
        {
            continue;
        }
        list.push(GetSocialPlayer(playerId, targetPlayerId));
        if (list.length >= maximum)
        {
            break;
        }
    }
    Spark.setScriptData("list", list);
}

function GetFriendList()
{
    var maximum = 50;
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerFriend, API.S("playerId").eq(playerId), API.sort("timestamp", false));
    var result = queryResult.cursor();
    while (result.hasNext())
    {
        var entry = result.next();
        var data = entry.getData();
        var targetPlayerId = data.targetPlayerId;
        if (playerId === targetPlayerId)
        {
            continue;
        }
        list.push(GetSocialPlayer(playerId, targetPlayerId));
        if (list.length >= maximum)
        {
            break;
        }
    }
    Spark.setScriptData("list", list);
}

function GetFriendRequestList()
{
    var maximum = 50;
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var list = [];
    var queryResult = API.queryItems(colPlayerFriendRequest, API.S("targetPlayerId").eq(playerId), API.sort("timestamp", false));
    var result = queryResult.cursor();
    while (result.hasNext())
    {
        var entry = result.next();
        var data = entry.getData();
        var targetPlayerId = data.targetPlayerId;
        if (playerId === targetPlayerId)
        {
            continue;
        }
        list.push(GetSocialPlayer(playerId, targetPlayerId));
        if (list.length >= maximum)
        {
            break;
        }
    }
    Spark.setScriptData("list", list);
}
