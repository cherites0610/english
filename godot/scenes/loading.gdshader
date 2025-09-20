shader_type canvas_item;

// 將外部的遮罩圖片作為輸入
uniform sampler2D mask_texture : source_color;

void fragment() {
    // 取得球體原始的顏色與透明度
    vec4 base_color = texture(TEXTURE, UV);

    // 取得遮罩圖片的顏色與透明度
    vec4 mask_color = texture(mask_texture, UV);

    // 最終顏色為球體的顏色，但其透明度等於兩者的透明度相乘
    // 這表示只有在遮罩和球體都有透明度的地方，才會顯示出來
    COLOR = vec4(base_color.rgb, base_color.a * mask_color.a);
}