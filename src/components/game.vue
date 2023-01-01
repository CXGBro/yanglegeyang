<template>
  <div @click="startHandler" class="startGame">{{data.isStart?"重新开始":"开始"}}游戏</div>
  <!-- 胜利 -->
  <div v-if="data.gameStatus === 3" style="text-align: center">
    <h2>恭喜，你赢啦！🎉</h2>
  </div>
  <!-- 主内容区 -->
  <div v-if="data.isStart" class="chessBoard">
    <div v-show="data.gameStatus > 0" class="mainBoard">
      <template v-for="block in data.levelBlocksVal">
        <div v-if="block.status === 0" class="chessBoardItem float"
          :class="{ disabled: block.higherThanBlock.length > 0 }"
          :style="{ zIndex: block.level, left: block.x * 22 + 'px', top: block.y * 22 + 'px', }"
          @click="clickHandler(block)">
          {{ block.type }}
        </div>
      </template>
    </div>

    <!-- 随机选块区 -->
    <div class="randomBoard">
      <div v-for="randomBlock, index in data.randomBlocksVal">
        <span v-if="randomBlock.length > 0" class="chessBoardItem" @click="clickHandler(randomBlock[0], index)">
          {{ randomBlock[0].type }}
        </span>
        <!-- 隐藏的面板 -->
        <span v-for="num in Math.max(randomBlock.length - 1, 0)" :key="num" class="chessBoardItem disabled">
          {{ randomBlock[num].type }}
        </span>
      </div>
    </div>

    <!-- 槽位区 -->
    <div class="slotBoard">
      超过7个即为失败:
      <div v-for="(slotBlock, index) in data.slotAreaVal" :key="index" class="slotBoardItem">
        {{ slotBlock?.type }}
      </div>
    </div>

  </div>

</template>

<script setup>
import { reactive } from 'vue';
import { gameConfig, contentType, mapWidth, mapHeight } from '../utils/config';
import { createRandomNum } from '../utils/utils'

const data = reactive({
  levelBlocksVal: '',
  randomBlocksVal: '',
  slotAreaVal: '',
  gameStatus: 0,
  slotBlockNum: 0,
  isStart: false,
  // 点击开始按钮的次数
  startNum:1
})

let mapBoard = []
// 初始化地图
function initMap(width, height) {
  for (let i = 0; i < height; i++) {
    mapBoard.push([]);
    for (let j = 0; j < width; j++) {
      mapBoard[i][j] = [];
    }
  }
}

// 计算总共需要的块元素
function sumTotalBlocks() {
  // 基本块数(总块数必须是该数的倍数)
  const basicBlockNum = 3 * contentType.length

  // 随机区生成的总块数 2行,每行8个
  const randomBlockNum = 16;

  // 最少生成的块数
  const minBlockNum = gameConfig.minLevelBlockNum * gameConfig.levelNum + randomBlockNum;

  // 总块数 如果总块数不是基本块数的倍数,就要补齐
  let totalBlockNum = minBlockNum;
  if (totalBlockNum % basicBlockNum !== 0) {
    // 最少块数/基本块数 如果是个整数,就说明这种块数方案合适,否则就把它变成一个整数
    totalBlockNum = Math.ceil(totalBlockNum / basicBlockNum) * basicBlockNum
  }
  return {
    randomBlockNum,
    totalBlockNum
  }
}

// 创建数组保存所有需要的地图块实例
function createAllBlocksArr(totalBlockNum) {
  // 块内容数组
  const contentArr = [];
  for (let i = 0; i < totalBlockNum; i++) {
    contentArr.push(contentType[i % contentType.length])  //这就实现了每一个小动物都有三个元素
  }

  // 所有地图块
  const mapBlocks = [];
  for (let i = 0; i < totalBlockNum; i++) {
    mapBlocks.push({
      id: i,
      status: 0,
      level: 0,
      type: contentArr[i],
      higherThanBlock: [],
      lowerThanBlock: []
    });
  };
  return mapBlocks
}

// 生成块坐标及上下层关系
function initBlockConnection(mapBlocks, randomBlockNum, totalBlockNum) {
  // 生成本层块元素坐标
  function genLevelBlockPos(blocks, blockLevel) {
    // 检测是否生成了一个重复的坐标
    const set = new Set();
    let randomX;
    let randomY;
    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index]
      // 生成随机数,当没有重复时停止生成
      while (true) {
        randomX = createRandomNum(0, mapWidth - 2);
        randomY = createRandomNum(0, mapHeight - 2);
        // 没有指定的键名时,说明从来没有生成过
        if (!set.has(randomX + ',' + randomY)) break;
      };
      // if(blockLevel===5) debugger
      // 批量添加进set防止重复
      for (let i = randomX - 1; i <= randomX + 1; i++) {
        for (let j = randomY - 1; j <= randomY + 1; j++) {
          set.add(i + ',' + j)
        }
      }
      block.x = randomX;
      block.y = randomY;
      block.level = blockLevel;
      mapBoard[randomX][randomY].push(block);
      genLevelRelation(block)
    }
  }

  // 获取本层块元素上下层关系
  function genLevelRelation(block) {
    // 设置可以影响到的格子范围
    // 可以影响到的范围是 x,y;x+1,y;x,y+1;x+1,y+1;

    // 遍历该格子周围受影响的格子
    const minX = Math.max(block.x - 1, 0);
    const minY = Math.max(block.y - 1, 0);
    const maxX = Math.min(block.x + 1, mapWidth - 1);
    const maxY = Math.min(block.y + 1, mapHeight - 1);
    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        const curBlock = mapBoard[i][j];
        if (curBlock.length > 0) {
          // 取最高一层的元素
          const maxLevelBlock = curBlock[curBlock.length - 1];
          // 排除自己 防止自己成为自己的最高/最低的元素
          if (maxLevelBlock.id === block.id || maxLevelBlock.level === block.level) {
            continue;
          }
          block.lowerThanBlock.push(maxLevelBlock);
          maxLevelBlock.higherThanBlock.push(block);
        }
      }
    }
  }

  // 记录添加到哪一个地图块
  let curBlock = 0;
  // 随机生成区的块内容(默认随机区两行,每行8个块)
  const randomBlocks = [[], []];
  for (let i = 0; i < randomBlocks.length; i++) {
    for (let j = 0; j < 8; j++) {
      randomBlocks[i].push(mapBlocks[curBlock]);
      curBlock++;
    };
  }

  // 剩余块数
  let leftBlockNum = totalBlockNum - randomBlockNum;
  // 本层需要的块数
  let levelBlockNum;
  const levelBlocksArr = [];
  for (let i = 0; i < gameConfig.levelNum; i++) {
    // 最后一层的块数就是剩余的块数
    if (i === gameConfig.levelNum - 1) {
      levelBlockNum = leftBlockNum
    } else { // 不是最后一层的块数为每层的最小块数
      levelBlockNum = gameConfig.minLevelBlockNum;
    }
    // 这一层所需要的块
    const levelBlocks = mapBlocks.slice(curBlock, curBlock + levelBlockNum);
    levelBlocksArr.push(...levelBlocks);
    // 随机在棋盘中放置块,并标记块之间的遮盖关系
    genLevelBlockPos(levelBlocks, i + 1);
    curBlock += levelBlockNum;
    leftBlockNum -= levelBlocks.length;
    if (leftBlockNum <= 0) {
      break;
    }
  }

  // 插槽区域数组
  const slotArea = [];
  return {
    levelBlocksArr, randomBlocks, slotArea
  }
}

function initGame() {
  const { randomBlockNum, totalBlockNum } = sumTotalBlocks();
  const mapBlocks = createAllBlocksArr(totalBlockNum);
  const { levelBlocksArr, randomBlocks, slotArea } = initBlockConnection(mapBlocks, randomBlockNum, totalBlockNum)

  return {
    levelBlocksArr,
    randomBlocks,
    slotArea,
  };
}

// 点击事件
const clickHandler = (block, randomIdx) => {
  // 如果点击的是随机区的方块
  if (randomIdx >= 0) {
    // 移除所点击的随机区域的第一个元素
    data.randomBlocksVal[randomIdx].shift()
  } else {
    // 超出保存区的范围 / 已经被点击 / 有上层块，不能再点击
    if (data.slotBlockNum >= 7 || block.status !== 0 || block.higherThanBlock.length > 0) return;
    // 这里是点击的普通区方块 ,移除覆盖关系
    for (let i of block.lowerThanBlock) {
      i.higherThanBlock = i.higherThanBlock.filter((item) => {
        return item.id !== block.id;
      })
    }
  }
  // 修改元素状态为已点击
  block.status = 1;
  // 新元素加入插槽
  data.slotAreaVal[data.slotBlockNum] = block;
  // 检查是否有可消除的
  const map = {};
  data.slotAreaVal.forEach((item) => {
    const type = item.type;
    if (!map[type]) {
      map[type] = 1;
    } else {
      map[type]++;
    }
  });
  // 得到新数组
  const newSlotAreaVal = [];
  let tempSlotNum = 0;
  data.slotAreaVal.forEach((item) => {
    // 成功消除（不添加到新数组中）
    if (map[item.type] >= 3) {
      // 块状态改为已消除
      item.status = 2;
      return;
    }
    newSlotAreaVal[tempSlotNum++] = item;
  });
  data.slotAreaVal = newSlotAreaVal;
  data.slotBlockNum = tempSlotNum;
  // 游戏结束
  if (tempSlotNum >= 7) {
    data.gameStatus = 2;
    setTimeout(() => {
      alert("你输了");
      startHandler()
    }, 2000);
  }
  // if (clearBlockNum >= data.totalBlockNum) {
  //   gameStatus.value = 3;
  // }
};

const startHandler = () => {
  // 第一次开始才进行判断
  if (data.startNum===1) {
    data.isStart = !data.isStart;
  }
  data.startNum += 1;
  initMap(mapWidth, mapHeight);
  data.gameStatus = 0;
  const { levelBlocksArr, randomBlocks, slotArea } = initGame();
  data.levelBlocksVal = levelBlocksArr;
  data.randomBlocksVal = randomBlocks;
  data.slotAreaVal = slotArea;
  data.gameStatus = 1;
};
</script>

<style scoped>
.startGame {
  width: fit-content;
  margin: 0 auto;
  margin-bottom: 20px;
  cursor: pointer;
  background: #fff;
  border: 4px solid;
}

.float {
  position: absolute;
}

.mainBoard {
  position: relative;
  width: 360px;
  height: 370px;
  margin: 0 auto;
}

.chessBoardItem {
  box-sizing: border-box;
  font-size: 28px;
  width: 42px;
  height: 42px;
  line-height: 42px;
  border: 1px solid #eee;
  background: white;
  text-align: center;
  opacity: 1;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0px 3px 0 0 #fff, 0 8px 0 0 #ddd, 0 8px 0 2px #333, 0 0 0 2px #333;
}

.disabled {
  background: grey;
  cursor: not-allowed;
  transition: none;
  transform: none;
}

.chessBoardItem:hover {
  transform: scale3d(1.1, 1.1, 1.1);
}

.randomBoard {
  display: flex;
  justify-content: center;
  /* margin: 0 20px; */
}

.slotBoard {
  /* display: flex;
  justify-content: center;
  margin-top: 16px; */
  white-space: nowrap;
  position: absolute;
  left: 50%;
  top: 80%;
  transform: translate(-50%, 0);
  pointer-events: none;

}

.slotBoardItem {
  display: inline-block;
  box-sizing: border-box;
  font-size: 28px;
  width: 42px;
  height: 42px;
  line-height: 42px;
  border: 1px solid #eee;
  background: white;
  text-align: center;
  opacity: 1;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0px 3px 0 0 #fff, 0 8px 0 0 #ddd, 0 8px 0 2px #333, 0 0 0 2px #333;
}
</style>
