<template>
    <div class="page-container">
        <h1>家具模板管理</h1>
        <el-button type="primary" @click="handleCreate" style="margin-bottom: 20px;">新增模板</el-button>

        <el-table :data="templates" v-loading="loading" border>
            <el-table-column label="預覽" width="100">
                <template #default="{ row }">
                    <el-image :src="row.imageUrl" fit="contain" style="width: 60px; height: 60px;"></el-image>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="名稱" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="width" label="寬度(格)" width="100" />
            <el-table-column prop="height" label="高度(格)" width="100" />
            <el-table-column label="操作" width="150">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">編輯</el-button>
                    <el-button link type="danger" @click="handleDelete(row.id)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="currentTemplate" ref="formRef" label-width="100px">
                <el-form-item label="模板名稱" prop="name" required><el-input
                        v-model="currentTemplate.name"></el-input></el-form-item>
                <el-form-item label="圖片 URL" prop="imageUrl" required><el-input
                        v-model="currentTemplate.imageUrl"></el-input></el-form-item>
                <el-form-item label="描述" prop="description" required><el-input type="textarea"
                        v-model="currentTemplate.description"></el-input></el-form-item>
                <el-form-item label="寬度(格)" prop="width" required><el-input-number v-model="currentTemplate.width"
                        :min="1"></el-input-number></el-form-item>
                <el-form-item label="高度(格)" prop="height" required><el-input-number v-model="currentTemplate.height"
                        :min="1"></el-input-number></el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">確定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 假設您已創建 furnitureTemplateApi，結構與 achievementApi 類似
import furnitureTemplateApi from '../api/furnitureTemplate.api'

const templates = ref([]);
const loading = ref(true);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref(null);

const defaultFormData = { id: null, name: '', description: '', imageUrl: '', width: 1, height: 1 };
const currentTemplate = reactive({ ...defaultFormData });

const fetchTemplates = async () => {
    loading.value = true;
    try {
        const response = await furnitureTemplateApi.getAll();
        templates.value = response.data;
    } catch (error) {
        ElMessage.error('獲取模板列表失敗');
    } finally {
        loading.value = false;
    }
};

const handleCreate = () => {
    Object.assign(currentTemplate, defaultFormData);
    dialogTitle.value = '新增家具模板';
    dialogVisible.value = true;
};

const handleEdit = (row) => {
    Object.assign(currentTemplate, row);
    dialogTitle.value = '編輯家具模板';
    dialogVisible.value = true;
};

const handleDelete = async (id) => {
    await ElMessageBox.confirm('確定要刪除這個模板嗎？', '警告', { type: 'warning' });
    try {
        await furnitureTemplateApi.delete(id);
        ElMessage.success('刪除成功');
        fetchTemplates();
    } catch (error) {
        if (error !== 'cancel') ElMessage.error('刪除失敗');
    }
};

const submitForm = async () => {
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const payload = { ...currentTemplate };
                if (payload.id) {
                    await furnitureTemplateApi.update(payload.id, payload);
                    ElMessage.success('更新成功');
                } else {
                    delete payload.id
                    await furnitureTemplateApi.create(payload);
                    ElMessage.success('新增成功');
                }
                dialogVisible.value = false;
                fetchTemplates();
            } catch (error) {
                ElMessage.error('操作失敗');
            }
        }
    });
};

onMounted(fetchTemplates);
</script>

<style scoped>
.page-container {
    padding: 20px;
}
</style>