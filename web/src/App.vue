<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <h1>英文沉浸後臺管理</h1>
      </div>
      <div class="header-right">
        <el-input v-model="tokenInput" placeholder="請在此輸入 Admin Token" class="token-input" @keyup.enter="saveToken" />
        <el-button type="primary" @click="saveToken">儲存 Token</el-button>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px">
        <el-menu router :default-active="$route.path" class="nav-menu">
          <el-menu-item index="/">
            <template #title>
              <span>對話實驗區</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/quest">
            <template #title>
              <span>任務管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/achievement">
            <template #title>
              <span>成就管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/furniture-template">
            <template #title>
              <span>家具模板管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/npc">
            <template #title>
              <span>NPC管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/battle">
            <template #title>
              <span>對戰管理</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 用於綁定 input 輸入框的 token
const tokenInput = ref('');

// 儲存 Token 的函式
const saveToken = () => {
  if (!tokenInput.value) {
    ElMessage.warning('Token 不能為空！');
    return;
  }

  // 將 Token 存入 localStorage
  localStorage.setItem('admin_token', tokenInput.value);

  // 提供使用者反饋
  ElMessage.success('Admin Token 已成功儲存！');

  // 可以在儲存後清空輸入框 (可選)
  // tokenInput.value = ''; 
};
</script>

<style scoped>
.app-container {
  height: 100vh;
  /* 讓容器佔滿整個視窗高度 */
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #dcdfe6;
}

.header-right {
  display: flex;
  align-items: center;
}

.token-input {
  width: 250px;
  margin-right: 12px;
}

.nav-menu {
  height: 100%;
  /* 讓選單填滿側邊欄高度 */
}

/* 移除 el-menu 的右側邊框，因為容器已經有邊框了 */
.el-aside .el-menu {
  border-right: none;
}

.el-main {
  background-color: #f4f4f5;
}
</style>