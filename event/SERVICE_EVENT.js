// ====================================================================================================
//
// Cloud Code for SERVICE_EVENT, write your code here to customize the GameSparks platform.
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

require("GAME_DATA_ENUM");
require("GAME_DATA");
require("HELPERS");
require("SERVICE_LISTING");

var logger = Spark.getLog();
var gsData = Spark.getData();
var target = gsData.TARGET;
var data = gsData.DATA;

if (target === "GetItemList")
{
    GetItemList();
}
else if (target === "GetCurrencyList")
{
    GetCurrencyList();
}
else if (target === "GetStaminaList")
{
    GetStaminaList();
}
else if (target === "GetFormationList")
{
    GetFormationList();
}
else if (target === "GetUnlockItemList")
{
    GetUnlockItemList();
}
else if (target === "GetClearStageList")
{
    GetClearStageList();
}