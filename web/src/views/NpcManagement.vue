<template>
    <div class="page-container">
        <h1>NPC 管理系統</h1>
        <el-button type="primary" @click="handleCreate" style="margin-bottom: 20px;">
            新增 NPC
        </el-button>

        <el-table :data="npcs" v-loading="loading" border stripe>
            <el-table-column label="頭像" width="100">
                <template #default="{ row }">
                    <el-avatar shape="square" :size="60" :src="row.avatar" />
                </template>
            </el-table-column>
            <el-table-column prop="name" label="名稱" width="200" />
            <el-table-column prop="backstory" label="背景故事" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">編輯</el-button>
                    <el-button link type="danger" @click="handleDelete(row.id)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
            <el-form :model="currentNpc" ref="formRef" label-width="100px" @submit.prevent>
                <el-form-item label="NPC 名稱" prop="name" required>
                    <el-input v-model="currentNpc.name" />
                </el-form-item>
                <el-form-item label="頭像 URL" prop="avatar" required>
                    <el-input v-model="currentNpc.avatar" />
                </el-form-item>
                <el-form-item label="聲音編號" prop="voiceId" required>
                    <el-input v-model="currentNpc.voiceId" />
                </el-form-item>
                <el-form-item label="背景故事" prop="backstory" required>
                    <el-input type="textarea" :rows="4" v-model="currentNpc.backstory" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm">確定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import npcApi from '../api/npc.api';
import type { NpcDto, CreateNpcDto } from '../types/dto/npc.dto';

// --- 響應式狀態 ---
const npcs = ref<NpcDto[]>([]);
const loading = ref(true);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref<any>(null); // Element Plus Form 的 ref 類型

// 用於表單的預設數據結構
const defaultFormData: CreateNpcDto & { id: string | null } = {
    id: null,
    name: '',
    avatar: '',
    voiceId: '',
    backstory: '',
};
const currentNpc = reactive({ ...defaultFormData });


// --- CRUD 方法 ---
const fetchNpcs = async () => {
    loading.value = true;
    try {
        const response = await npcApi.getAll();
        npcs.value = response.data;
    } catch (error) {
        console.error('獲取 NPC 列表失敗:', error);
    } finally {
        loading.value = false;
    }
};

const handleCreate = () => {
    Object.assign(currentNpc, JSON.parse(JSON.stringify(defaultFormData)));
    dialogTitle.value = '新增 NPC';
    dialogVisible.value = true;
};

const handleEdit = (row: NpcDto) => {
    Object.assign(currentNpc, JSON.parse(JSON.stringify(row)));
    dialogTitle.value = '編輯 NPC';
    dialogVisible.value = true;
};

const handleDelete = async (id: string) => {
    try {
        await ElMessageBox.confirm('此操作將永久刪除該 NPC，是否繼續？', '警告', {
            type: 'warning',
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消',
        });
        await npcApi.delete(id);
        ElMessage.success('刪除成功');
        fetchNpcs(); // 成功後刷新列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('刪除失敗:', error);
        }
    }
};

const submitForm = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            const payload = { ...currentNpc };
            try {
                if (payload.id) {
                    // 更新
                    await npcApi.update(payload.id, payload);
                    ElMessage.success('更新成功');
                } else {
                    // 新增
                    delete (payload as any).id
                    await npcApi.create(payload);
                    ElMessage.success('新增成功');
                }
                dialogVisible.value = false;
                fetchNpcs();
            } catch (error) {
                console.error('操作失敗:', error);
            }
        }
    });
};

// --- 生命週期鉤子 ---
onMounted(() => {
    fetchNpcs();
});
</script>

<style scoped>
.page-container {
    padding: 20px;
}

.dialog-footer {
    text-align: right;
}
</style>