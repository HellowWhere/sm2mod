package com.example.sm2mod;

import java.util.function.Supplier;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.math.Axis;

import net.minecraft.client.renderer.LightTexture;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.entity.EntityRenderer;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.ItemRenderer;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.client.renderer.texture.TextureAtlas;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.Mth;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemDisplayContext;
import net.minecraft.world.item.ItemStack;

/** Renders a projectile as a full-bright 3D model aligned with its flight direction (model long axis = +X). */
public class GlowProjectileRenderer<T extends Entity> extends EntityRenderer<T> {
    private final ItemRenderer itemRenderer;
    private final Supplier<Item> item;
    private ItemStack stack;

    public GlowProjectileRenderer(EntityRendererProvider.Context context, Supplier<Item> item) {
        super(context);
        this.itemRenderer = context.getItemRenderer();
        this.item = item;
    }

    @Override
    public void render(T entity, float yaw, float partialTick, PoseStack poseStack, MultiBufferSource buffer, int light) {
        if (stack == null) {
            stack = new ItemStack(item.get());
        }
        poseStack.pushPose();
        poseStack.mulPose(Axis.YP.rotationDegrees(Mth.lerp(partialTick, entity.yRotO, entity.getYRot()) - 90.0F));
        poseStack.mulPose(Axis.ZP.rotationDegrees(Mth.lerp(partialTick, entity.xRotO, entity.getXRot())));
        itemRenderer.renderStatic(stack, ItemDisplayContext.FIXED, LightTexture.FULL_BRIGHT, OverlayTexture.NO_OVERLAY,
                poseStack, buffer, entity.level(), entity.getId());
        poseStack.popPose();
        super.render(entity, yaw, partialTick, poseStack, buffer, light);
    }

    @Override
    public ResourceLocation getTextureLocation(T entity) {
        return TextureAtlas.LOCATION_BLOCKS;
    }
}
