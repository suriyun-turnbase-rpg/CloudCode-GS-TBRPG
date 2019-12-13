// ====================================================================================================
//
// Cloud Code for GAME_DATA_ENUM, write your code here to customize the GameSparks platform.
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

const ENUM_STAMINA_UNIT_SECONDS = 0;
const ENUM_STAMINA_UNIT_MINUTES = 1;
const ENUM_STAMINA_UNIT_HOURS = 2;
const ENUM_STAMINA_UNIT_DAYS = 3;

const ENUM_LOOTBOX_REQUIREMENT_TYPE_SOFT_CURRENCY = 0;
const ENUM_LOOTBOX_REQUIREMENT_TYPE_HARD_CURRENCY = 1;

const ENUM_BATTLE_RESULT_NONE = 0;
const ENUM_BATTLE_RESULT_LOSE = 1;
const ENUM_BATTLE_RESULT_WIN = 2;

const ENUM_BATTLE_TYPE_STAGE = 0;
const ENUM_BATTLE_TYPE_ARENA = 1;

const ENUM_FORMATION_TYPE_STAGE = 0;
const ENUM_FORMATION_TYPE_ARENA = 1;

const ENUM_TOTAL_CLEAR_STAGE = 0;
const ENUM_TOTAL_CLEAR_STAGE_RATING = 1;
const ENUM_COUNT_LEVEL_UP_CHARACTER = 2;
const ENUM_COUNT_LEVEL_UP_EQUIPMENT = 3;
const ENUM_COUNT_EVOLVE_CHARACTER = 4;
const ENUM_COUNT_EVOLVE_EQUIPMENT = 5;
const ENUM_COUNT_REVIVE = 6;
const ENUM_COUNT_USE_HELPER = 7;
const ENUM_COUNT_WIN_STAGE = 8;
const ENUM_COUNT_WIN_DUEL = 9;

const ERROR_PREFIX = "ERROR_";
const ERROR_UNKNOW = ERROR_PREFIX + "UNKNOW";
const ERROR_EMPTY_USERNMAE_OR_PASSWORD = ERROR_PREFIX + "EMPTY_USERNMAE_OR_PASSWORD";
const ERROR_EXISTED_USERNAME = ERROR_PREFIX + "EXISTED_USERNAME";
const ERROR_EMPTY_PROFILE_NAME = ERROR_PREFIX + "EMPTY_PROFILE_NAME";
const ERROR_EXISTED_PROFILE_NAME = ERROR_PREFIX + "EXISTED_PROFILE_NAME";
const ERROR_INVALID_USERNMAE_OR_PASSWORD = ERROR_PREFIX + "INVALID_USERNMAE_OR_PASSWORD";
const ERROR_INVALID_LOGIN_TOKEN = ERROR_PREFIX + "INVALID_LOGIN_TOKEN";
const ERROR_INVALID_PLAYER_DATA = ERROR_PREFIX + "INVALID_PLAYER_DATA";
const ERROR_INVALID_PLAYER_ITEM_DATA = ERROR_PREFIX + "INVALID_PLAYER_ITEM_DATA";
const ERROR_INVALID_ITEM_DATA = ERROR_PREFIX + "INVALID_ITEM_DATA";
const ERROR_INVALID_FORMATION_DATA = ERROR_PREFIX + "INVALID_FORMATION_DATA";
const ERROR_INVALID_STAGE_DATA = ERROR_PREFIX + "INVALID_STAGE_DATA";
const ERROR_INVALID_LOOT_BOX_DATA = ERROR_PREFIX + "INVALID_LOOT_BOX_DATA";
const ERROR_INVALID_IAP_PACKAGE_DATA = ERROR_PREFIX + "INVALID_IAP_PACKAGE_DATA";
const ERROR_INVALID_ACHIEVEMENT_DATA = ERROR_PREFIX + "INVALID_ACHIEVEMENT_DATA";
const ERROR_INVALID_EQUIP_POSITION = ERROR_PREFIX + "INVALID_EQUIP_POSITION";
const ERROR_INVALID_BATTLE_SESSION = ERROR_PREFIX + "INVALID_BATTLE_SESSION";
const ERROR_NOT_ENOUGH_SOFT_CURRENCY = ERROR_PREFIX + "NOT_ENOUGH_SOFT_CURRENCY";
const ERROR_NOT_ENOUGH_HARD_CURRENCY = ERROR_PREFIX + "NOT_ENOUGH_HARD_CURRENCY";
const ERROR_NOT_ENOUGH_STAGE_STAMINA = ERROR_PREFIX + "NOT_ENOUGH_STAGE_STAMINA";
const ERROR_NOT_ENOUGH_ARENA_STAMINA = ERROR_PREFIX + "NOT_ENOUGH_ARENA_STAMINA";
const ERROR_NOT_ENOUGH_ITEMS = ERROR_PREFIX + "NOT_ENOUGH_ITEMS";
const ERROR_ACHIEVEMENT_UNDONE = ERROR_PREFIX + "ACHIEVEMENT_UNDONE";
const ERROR_ACHIEVEMENT_EARNED = ERROR_PREFIX + "ACHIEVEMENT_EARNED";
const ERROR_CANNOT_EVOLVE = ERROR_PREFIX + "CANNOT_EVOLVE";
