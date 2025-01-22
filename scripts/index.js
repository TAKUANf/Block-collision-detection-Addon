import { world, system } from "@minecraft/server";

// 衝突判定を行うブロックのタイプ
const targetBlockType = ["minecraft:diamond_block", "minecraft:iron_block"]; // 配列で複数指定可能
//const targetBlockType = "*"; // すべてのブロックを対象にする場合はこちら
//const excludeBlockTypes = ["minecraft:air","minecraft:grass_block"] // 除外するブロックタイプ（すべてを対象にした場合のみ有効）

const checkRadius = 2.5; // AABB判定を行う最大距離

// ブロックの中心オフセット
const centerXOffset = 0.5;
const centerYOffset = 0;
const centerZOffset = 0.5;

// 各ブロックタイプのオフセット
const blockOffset = {
  min: { x: -0.5001, y: 0.0001, z: -0.5001 },
  max: { x: 0.5001, y: 1, z: 0.5001 }
};
const fenceOffset = {
  min: { x: -0.1251, y: 0, z: -0.1251 },
  max: { x: 0.1251, y: 1.5, z: 0.1251 }
};
const paneOffset = {
  min: { x: -0.1251, y: 0, z: -0.1251 },
  max: { x: 0.1251, y: 1.5, z: 0.1251 }
};
const wallOffset = {
  min: { x: -0.1251, y: 0, z: -0.1251 },
  max: { x: 0.1251, y: 1.5, z: 0.1251 }
};

// 衝突時の処理
function handlePlayerBlockCollision(block, player) {
  player.sendMessage(`§a[Collision Event]§r You collided with a ${block.typeId}!`);
  player.playSound("note.pling", { volume: 0.5, pitch: 1 });
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const playerAABB = getPlayerBoundingBox(player);

    const nearbyBlockLocations = getNearbyBlockLocations(player.location, 2);
    for (const location of nearbyBlockLocations) {
      const block = player.dimension.getBlock(location);
      if (block) {
        if (
          (targetBlockType === "*" && !excludeBlockTypes.includes(block.typeId)) ||
          (Array.isArray(targetBlockType) && targetBlockType.includes(block.typeId))
        ) {
          const distance = calculateDistance(player.location, block.location);

          if (distance <= checkRadius) {
            const blockAABB = getBlockBoundingBox(block);
            if (intersectsAABB(playerAABB, blockAABB)) {
              handlePlayerBlockCollision(block, player);
            }
          }
        }
      }
    }
  }
}, 1);

// プレイヤーのAABBを取得
function getPlayerBoundingBox(player) {
  const playerLocation = player.location;
  return {
    min: { x: playerLocation.x - 0.3, y: playerLocation.y, z: playerLocation.z - 0.3 },
    max: { x: playerLocation.x + 0.3, y: playerLocation.y + 1.8, z: playerLocation.z + 0.3 }
  };
}

// ブロックのAABBを取得
function getBlockBoundingBox(block) {
  const location = block.location;
  const offsetX = location.x + centerXOffset;
  const offsetY = location.y + centerYOffset;
  const offsetZ = location.z + centerZOffset;

  let minX = offsetX + blockOffset.min.x;
  let minY = offsetY + blockOffset.min.y;
  let minZ = offsetZ + blockOffset.min.z;
  let maxX = offsetX + blockOffset.max.x;
  let maxY = offsetY + blockOffset.max.y;
  let maxZ = offsetZ + blockOffset.max.z;

  if (block.typeId.includes("fence")) {
    minX = offsetX + fenceOffset.min.x;
    maxX = offsetX + fenceOffset.max.x;
    minY = offsetY + fenceOffset.min.y;
    maxY = offsetY + fenceOffset.max.y;
    minZ = offsetZ + fenceOffset.min.z;
    maxZ = offsetZ + fenceOffset.max.z;
  } else if (block.typeId.includes("pane") || block.typeId.includes("bars")) {
    minX = offsetX + paneOffset.min.x;
    maxX = offsetX + paneOffset.max.x;
    minY = offsetY + paneOffset.min.y;
    maxY = offsetY + paneOffset.max.y;
    minZ = offsetZ + paneOffset.min.z;
    maxZ = offsetZ + paneOffset.max.z;
  } else if (block.typeId.includes("wall")) {
    minX = offsetX + wallOffset.min.x;
    maxX = offsetX + wallOffset.max.x;
    minY = offsetY + wallOffset.min.y;
    maxY = offsetY + wallOffset.max.y;
    minZ = offsetZ + wallOffset.min.z;
    maxZ = offsetZ + wallOffset.max.z;
  } else if (block.typeId.includes("stairs")) {
    minY = offsetY;
    maxX = offsetX + 1;
    maxY = offsetY + 1;
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ }
  };
}

// AABBの衝突判定
function intersectsAABB(aabb1, aabb2) {
  return (
    aabb1.min.x <= aabb2.max.x &&
    aabb1.max.x >= aabb2.min.x &&
    aabb1.min.y <= aabb2.max.y &&
    aabb1.max.y >= aabb2.min.y &&
    aabb1.min.z <= aabb2.max.z &&
    aabb1.max.z >= aabb2.min.z
  );
}

// 周辺のブロック座標を取得
function getNearbyBlockLocations(location, radius) {
  const locations = [];
  for (let x = location.x - radius; x <= location.x + radius; x++) {
    for (let y = location.y - radius; y <= location.y + radius; y++) {
      for (let z = location.z - radius; z <= location.z + radius; z++) {
        locations.push({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
      }
    }
  }
  return locations;
}

// 2点間の距離を計算
function calculateDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}