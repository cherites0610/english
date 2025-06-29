<template>
    <div class="page-container">
        <h1>成就管理</h1>
        <el-button type="primary" @click="handleCreate" style="margin-bottom: 20px;">新增成就</el-button>

        <el-table :data="achievements" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="200" />
            <el-table-column prop="name" label="名稱" width="200" />
            <el-table-column prop="acquisitionMethod" label="達成方式" width="250" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="150">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">編輯</el-button>
                    <el-button link type="danger" @click="handleDelete(row.id)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="currentAchievement" ref="formRef" label-width="100px">
                <el-form-item label="成就名稱" prop="name" required>
                    <el-input v-model="currentAchievement.name"></el-input>
                </el-form-item>
                <el-form-item label="圖片 URL" prop="picture" required>
                    <el-input v-model="currentAchievement.picture"></el-input>
                </el-form-item>
                <el-form-item label="達成方式" prop="acquisitionMethod" required>
                    <el-input v-model="currentAchievement.acquisitionMethod"></el-input>
                </el-form-item>
                <el-form-item label="描述" prop="description" required>
                    <el-input type="textarea" v-model="currentAchievement.description"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm">確定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import achievementApi from '../api/achievement.api';

// --- 響應式狀態 ---
const achievements = ref([]);
const loading = ref(true);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref(null);

const defaultFormData = {
    id: null,
    name: '',
    picture: '',
    acquisitionMethod: '',
    description: '',
};
const currentAchievement = reactive({ ...defaultFormData });

// --- 方法 ---

// 獲取成就列表
const fetchAchievements = async () => {
    loading.value = true;
    try {
        const response = await achievementApi.getAll();
        achievements.value = response.data;
    } catch (error) {
        ElMessage.error('獲取成就列表失敗');
    } finally {
        loading.value = false;
    }
};

// 處理新增
const handleCreate = () => {
    Object.assign(currentAchievement, defaultFormData);
    dialogTitle.value = '新增成就';
    dialogVisible.value = true;
};

// 處理編輯
const handleEdit = (row) => {
    Object.assign(currentAchievement, row);
    dialogTitle.value = '編輯成就';
    dialogVisible.value = true;
};

// 處理刪除
const handleDelete = async (id) => {
    try {
        await ElMessageBox.confirm('確定要刪除這個成就嗎？', '警告', {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning',
        });
        await achievementApi.delete(id);
        ElMessage.success('刪除成功');
        fetchAchievements(); // 重新獲取列表
    } catch (error) {
        // 如果用戶點擊取消，error 會是 'cancel'，我們不做任何事
        if (error !== 'cancel') {
            ElMessage.error('刪除失敗');
        }
    }
};

// 提交表單 (新增或更新)
const submitForm = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (currentAchievement.id) {
                    // 更新
                    await achievementApi.update(currentAchievement.id, currentAchievement);
                    ElMessage.success('更新成功');
                } else {
                    // 新增
                    delete currentAchievement.id
                    await achievementApi.create(currentAchievement);
                    ElMessage.success('新增成功');
                }
                dialogVisible.value = false;
                fetchAchievements(); // 重新獲取列表
            } catch (error) {
                ElMessage.error('操作失敗');
            }
        }
    });
};

// --- 生命週期鉤子 ---
onMounted(() => {
    fetchAchievements();
});
</script>

<style scoped>
.page-container {
    padding: 20px;
}
</style>