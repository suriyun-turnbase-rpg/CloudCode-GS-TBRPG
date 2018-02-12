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

var colPlayerItem = Spark.runtimeCollection("playerItem");
var colPlayerStamina = Spark.runtimeCollection("playerStamina");
var colPlayerFormation = Spark.runtimeCollection("playerFormation");
var colPlayerUnlockItem = Spark.runtimeCollection("playerUnlockItem");
var colPlayerClearStage = Spark.runtimeCollection("playerClearStage");
var colPlayerBattle = Spark.runtimeCollection("playerBattle");

function GetItemList()
{
    var player = Spark.getPlayer();
    var userId = player.getPlayerId();
    var list = [];
    var result = colPlayerItem.find({ "userId" : userId });
    while (result.hasNext())
    {
        var entry = result.next();
        list.push(entry);
    }
    Spark.setScriptData("list", list);
}

function GetStaminaList()
{
    var player = Spark.getPlayer();
    var userId = player.getPlayerId();
    var list = [];
    var result = colPlayerStamina.find({ "userId" : userId });
    while (result.hasNext())
    {
        var entry = result.next();
        list.push(entry);
    }
    Spark.setScriptData("list", list);
}

function GetFormationList()
{
    var player = Spark.getPlayer();
    var userId = player.getPlayerId();
    var list = [];
    var result = colPlayerFormation.find({ "userId" : userId });
    while (result.hasNext())
    {
        var entry = result.next();
        list.push(entry);
    }
    Spark.setScriptData("list", list);
}

function GetUnlockItemList()
{
    var player = Spark.getPlayer();
    var userId = player.getPlayerId();
    var list = [];
    var result = colPlayerUnlockItem.find({ "userId" : userId });
    while (result.hasNext())
    {
        var entry = result.next();
        list.push(entry);
    }
    Spark.setScriptData("list", list);
}

function GetClearStageList()
{
    var player = Spark.getPlayer();
    var userId = player.getPlayerId();
    var list = [];
    var result = colPlayerClearStage.find({ "userId" : userId });
    while (result.hasNext())
    {
        var entry = result.next();
        list.push(entry);
    }
    Spark.setScriptData("list", list);
}
